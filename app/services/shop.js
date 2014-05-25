angular.module('ecoposApp').factory('shop',function($q, system, syncData, firebaseRef, $firebase, $filter, FBURL, FBSHOPSROOT, $log) {
    var data = {
        store: {products: {}, catalogs: {}, browser: {}, inventory: {}},
        shops: {},

        invoice: { order: {}, orderRef: null, items:{}, delivery: false }
    };

    var CatalogBrowser = function(newShop){
        if(typeof newShop === 'undefined'){
            newShop = null;
        }

        var private = {
            catalog: null,
            reqPath: '',

            breadCrumble: function(crumbs){
                if(typeof crumbs === 'undefined'){
                    crumbs = [];
                }
                var crumble = [];
                var catalogRef = null;
                if(private.catalog){
                    catalogRef = private.catalog.$getRef();
                    if(catalogRef){
                        crumbs.unshift(private.getPathForCatalogRef(catalogRef, true, true));
                    }
                }

                var cTrace = 0;
                var diffPoint = false;
                angular.forEach(crumbs, function(crumb, crumbID){
                    crumble.push(crumb);
                    var cPath = '/'+crumble.slice(1).join('/');
                    var nameRef = syncData(crumble.join('/children/')+'/name');
                    var childrenRef = syncData(crumble.join('/children/')+'/children');

                    if(cTrace >= 0 && public.path[cTrace] && public.path[cTrace].path === cPath){
                        cTrace++;
                    }
                    else{
                        if(!diffPoint){
                            diffPoint = true;
                            if(public.path[cTrace]){
                                public.path.splice(cTrace, public.path.length-cTrace);
                            }
                        }
                        var newCrumb = {
                            name: nameRef,
                            path: cPath
                        };

                        childrenRef.$on('value', function(){
                            newCrumb.children = [];
                            angular.forEach(childrenRef, function(child, childID){
                                if(child.name && childID.charAt(0) !== '$'){
                                    var newChild = {id: childID, name: child.name};
                                    if(child.url){
                                        newChild.url = cPath+((cPath.charAt(cPath.length-1) !== '/' && child.url.charAt(0) !== '/')?'/':'')+child.url;
                                    }
                                    else if(childID){
                                        newChild.url = cPath+((cPath.charAt(cPath.length-1) !== '/' && childID.charAt(0) !== '/')?'/':'')+childID;
                                    }
                                    if(!child.children){
                                        newChild.productID = childID;
                                    }
                                    newCrumb.children.push(newChild);
                                }
                            });
                        });

                        public.path.push(newCrumb);
                        cTrace++;
                    }

                });
                if(public.path.length > cTrace){
                    public.path.splice(cTrace, (public.path.length-cTrace));
                }
            },

            setCatalog: function(newCatalog){
                if(newCatalog !== private.catalog){
                    private.catalog = newCatalog;
                    return private.loadPath(private.reqPath);
                }
                var defer = $q.defer();
                defer.resolve(public.category);
                return defer.promise;
            },

            setCategory: function(category) {
                var defer = $q.defer();

                if(category.children){
                    public.category = category;
                    public.pathStr = private.getPathForCatalogRef(category.$getRef());
                    public.product = null;
                    public.productURI = '';
                    api.loadInventoryProducts(category.children, (public.shop?public.shop.inventory:''));
                    defer.resolve(public.category);
                }
                else{
                    defer.reject('Invalid Category');
                }
                return defer.promise;
            },

            setProductFromCategory: function(category, productURI){
                var defer = $q.defer();
                if(productURI){
                    if(category.children){
                        angular.forEach(category.children, function(child, childID){
                            if(child.url && child.url === productURI){
                                public.productURI = productURI;
                                public.setProduct(childID).then(function(product){
                                    if(!product){
                                        public.product = {name: child.name, notFound: true};
                                    }
                                });
                                public.path.push({
                                    name: syncData(private.getPathForCatalogRef(category.$getRef(), true, true)+'/children/'+childID+'/name'),
                                    path: private.getPathForCatalogRef(category.$getRef())+'/'+productURI
                                });
                            }
                        });
                        if(!public.product){
                            public.product = {name: productURI, invalid: true};
                            public.productURI = productURI;
                        }
                        defer.resolve(public.product);
                    }
                }
                else{
                    defer.resolve(null);
                }
                return defer.promise;
            },

            getPathForCatalogRef: function(fbRef, absolute, database){
                if(typeof absolute === 'undefined'){
                    absolute = false;
                }
                if(typeof database === 'undefined'){
                    database = false;
                }
                var path = ''+fbRef;
                if(path){
                    if(!absolute && private.catalog && typeof private.catalog.$getRef === 'function'){
                        path = path.replace(private.catalog.$getRef().toString(), '');
                    }
                    if(FBURL){
                        path = path.replace(FBURL, '');
                    }
                    if(!database){
                        path = path.replace(/children\//g, '');
                    }
                }
                return path;
            },


            loadPath: function(path, productURI) {
                var defer = $q.defer();
                private.reqPath = path; // requested path
                if(private.catalog){
                    $log.debug('load catalog path \'' + path + '\' in ' + private.catalog.name);

                    var pathParts = [];
                    if(path.charAt(0) === '/'){
                        path = path.substr(1);
                    }
                    if(path.charAt(path.length-1) === '/'){
                        path = path.substr(0, path.length-1);
                    }
                    if(path){
                        pathParts = path.split('/');
                    }
                    var emptyIdx;
                    while((emptyIdx = pathParts.indexOf('')) !== -1){
                        pathParts.splice(emptyIdx, 1);
                    }

                    if(pathParts.length) {
                        var catRefPath = 'children/' + pathParts.join('/children/');
                        var catChild = private.catalog.$child(catRefPath);
                        catChild.$on('loaded', function(){
                            private.setCategory(catChild).then(function(category){
                                    private.breadCrumble(pathParts);
                                    private.setProductFromCategory(category, productURI);
                                    defer.resolve(category);
                                },
                                function(error){
                                    if(error === 'Invalid Category'){
                                        var productTry = pathParts.pop();
                                        private.loadPath(pathParts.join('/'), productTry);
                                    }
                                    else{
                                        defer.reject(error);
                                    }
                                });
                        });
                    }
                    else {
                        private.setCategory(private.catalog).then(function(category){
                                private.breadCrumble();
                                private.setProductFromCategory(category, productURI);
                                defer.resolve(category);
                            },
                            function(error){
                                defer.reject(error);
                            });
                    }
                }
                else{
                    defer.reject('No Catalog');
                }
                return defer.promise;
            }
        };

        var public = {
            shop: null,
            category: null,
            product: null,
            path: [],

            pathStr: '/',
            productURI: '',

            getPathURI: function(){
                return public.pathStr+((public.pathStr.charAt(public.pathStr.length-1)!=='/' && public.productURI.charAt(0) !=='/')?'/':'')+public.productURI;
            },

            setPath: function(newPath){
                if (newPath === '') {
                    newPath = '/';
                }
                if (newPath !== public.getPathURI()) {
                    return private.loadPath(newPath);
                }
                var defer = $q.defer();
                defer.resolve(public.category);
                return defer.promise;
            },

            setProduct: function(productID){
                var defer = $q.defer();
                api.loadInventoryProduct(productID, (public.shop?public.shop.inventory:'')).then(function(product){
                    public.product = product;
                    defer.resolve(product);
                });
                return defer.promise;
            },

            setShop: function(shop){
                if(shop && shop.catalog){
                    public.shop = shop;
                    api.loadCatalog(shop.catalog).then(function(catalog){
                        private.setCatalog(catalog);
                    });
                }
            }
        };

        public.setShop(newShop);

        return public;
    };

    var api = {
        // Cart API
        assertProductStock: function(product){
            var defer = $q.defer();
            if(product && product.stock){
                defer.resolve(product.stock);
            }
            else{
                defer.resolve(0);
            }
            return defer.promise;
        },

        addProduct: function(product, qty) {
            var productID = product.$id?product.$id:0;
            var name = product.name?product.name:'Unknown';
            var price = product.price?product.price:0;

            var qtyReq = parseInt(qty);
            if(data.invoice.items[productID] && data.invoice.items[productID].qty){
                qtyReq += data.invoice.items[productID].qty;
            }

            if(product.stock){
                if(product.stock < qtyReq){
                    qtyReq = product.stock;
                }
                if(data.invoice.items[productID]){
                    data.invoice.items[productID].qty = qtyReq;
                } else {
                    if(product.stock && product.stock > qty){
                        data.invoice.items[productID] = {
                            qty: qtyReq,
                            name: name,
                            price: price
                        };
                    }
                }
                api.updateOrder({items: data.invoice.items});
            }

        },
        removeItem: function(productID) {
            if(data.invoice.items[productID]){
                delete data.invoice.items[productID];
                api.updateOrder({items: data.invoice.items});
                /**api.loadInventoryProduct(productID).then(function(product){
                    if(product) {
                        delete data.invoice.items[productID];
                        api.updateOrder({items: data.invoice.items});
                    }
                });*/
            }
        },
        changeProductQty: function(productID){
            if(data.invoice.items[productID] && data.invoice.order.items[productID]){
                // TODO: ensure there is enough product in stock
                api.updateOrder({items: data.invoice.items});

                /**api.loadInventoryProduct(productID).then(function(product) {
                    if(product){
                        if(product.stock){
                            if(product.stock < data.invoice.items[productID].qty){
                                data.invoice.items[productID].qty = product.stock;
                            }
                        }
                        api.updateOrder({items: data.invoice.items});
                    }
                });
                 */
            }
        },
        emptyCart: function(){
            angular.forEach(Object.keys(data.invoice.items), function(itemID, itemIdx){
                delete data.invoice.items[itemID];
            });
        },
        cartTotal: function() {
            var total = 0;
            angular.forEach(data.invoice.items, function(item) {
                total += item.qty * item.price;
            });

            return total;
        },

        assertOrderOnline: function(){
            // makes sure there is an order on the database
            var defer = $q.defer();

            if(!data.invoice.order.$id){
                api.createOrder().then(function(){
                    defer.resolve(data.invoice.order);
                });
            }
            else{
                defer.resolve(data.invoice.order);
            }

            return defer.promise;
        },
        createOrder: function(activateForUser){
            if(typeof activateForUser === 'undefined'){
                activateForUser = true;
            }
            var defer = $q.defer();
            var newOrder = {
                createdTime: system.api.currentTime(),
                status: 0
            };
            newOrder.name = $filter('date')(newOrder.createdTime, 'EEE, MMM d')+' @ '+$filter('date')(newOrder.createdTime, 'shortTime');
            if(!data.invoice.orderRef){
                data.invoice.orderRef = firebaseRef('order').push(newOrder);
            }

            data.invoice.orderRef.once('value', function(orderSnap){
                data.invoice.order = $firebase(data.invoice.orderRef);
                if(activateForUser){
                    system.api.activateUserOrder(orderSnap.name());
                }
                defer.resolve(data.invoice.order);
            });

            return defer.promise;
        },
        loadOrder: function(orderID, force){
            if(typeof force === 'undefined'){ force = false; }
            var defer = $q.defer();

            if(orderID){
                if(orderID === 'new'){
                    data.invoice.orderRef = null;
                    data.invoice.order = null;
                    api.createOrder().then(function(order){
                        api.emptyCart();
                        api.updateOrder({status:0}); // this also binds it to user
                        defer.resolve(data.invoice.order);
                    });
                }
                else if(force || !data.invoice.order || data.invoice.order.$id !== orderID){
                    data.invoice.orderRef = firebaseRef('order').child(orderID);
                    data.invoice.orderRef.once('value', function(orderSnap){
                        data.invoice.order = $firebase(data.invoice.orderRef);
                        system.api.activateUserOrder(orderSnap.name());
                        api.emptyCart();
                        angular.forEach(orderSnap.val().items, function(item, itemID){
                            data.invoice.items[itemID] = item;
                        });
                        defer.resolve(data.invoice.order);
                    });
                }
                else{
                    defer.resolve(data.invoice.order);
                }
            }
            else{
                defer.resolve(null);
            }

            return defer.promise;
        },
        updateOrder: function(withData){
            api.assertOrderOnline().then(function(order) {
                if(order) {
                    // small wrapper for order.$update that appends the user object all the time
                    withData.users = order.users?order.users:{};
                    var dataProms = [];
                    if (system.data.user.id) {
                        system.api.setUserOrder(order);
                        withData.users[system.data.user.id] = system.api.currentTime();
                    }
                    else {
                        var newProm = system.api.anonymousID();
                        newProm.then(function (anonID) {
                            withData.users[anonID] = system.api.currentTime();
                        });
                        dataProms.push(newProm);
                    }

                    $q.all(dataProms).then(function () {
                        order.$update(withData);
                    });
                }
            });
        },
        removeOrder: function(orderID){
            var order = syncData('order/'+orderID);
            order.$on('loaded', function(){
                angular.forEach(order.users, function(usertime, userID){
                    syncData('user/'+userID+'/orders/'+orderID).$remove();
                });
                order.$remove();
            });

        },

        orderCheckout: function(){
            api.assertOrderOnline().then(function(order){
                if(order){
                    /** TODO:
                     * - check each item's inventory level against database
                     * - throw an error if there is not enough of the product
                     *      (maybe someone bought it in between shop and checkout)
                     *      - make offer of raincheck?
                     * - adjust each item's stock level
                     */

                    var updates = {
                        status: 1,
                        checkoutTime: system.api.currentTime(),
                        items: data.invoice.items,
                        paymentStatus: 'unpaid',
                        delivery: data.invoice.delivery
                    };

                    if(data.invoice.delivery){
                        updates.deliveryStatus = 'processing';
                        firebaseRef('deliveryQueue/'+order.$id).setWithPriority(true, updates.checkoutTime);
                    }

                    order.$update(updates);
                }
            });
        },

        orderPayment: function(orderID, paymentData){
            /** TODO:
             * - load the order, add payments/{paymentData}
             * - if total of order.payments >= order.total
             *      - update order.paymentStatus as 'paid' or 'partial'
             */
            var order = syncData('order/'+orderID);
            order.$on('loaded', function(){
                paymentData.time = system.api.currentTime();
                order.$child('payments').$add(paymentData);

                // TODO: maybe we want to store an order total?  we should do that when they click "checkout"
                var cOrderTotal = 0;
                angular.forEach(order.items, function(item, itemID){
                    cOrderTotal += item.qty*item.price;
                });

                // TODO: maybe we want to store an order paid amount?
                var cOrderPaid = 0;
                angular.forEach(order.payments, function(payment, paymentID){
                    cOrderPaid += payment.amount;
                });

                if(cOrderPaid === cOrderTotal){
                    order.$update({paymentStatus: 'paid'});
                    system.api.sendNotification({roles: ['manager', 'admin']}, 'order', 'Order fully paid.', null, [{type: 'order', path: 'order/'+orderID}]);
                }
                else if(cOrderPaid === 0){
                    order.$update({paymentStatus: 'unpaid'});
                }
                else if(cOrderPaid > 0 && cOrderPaid < cOrderTotal){
                    order.$update({paymentStatus: 'partial'});
                }
                else if(cOrderPaid > cOrderTotal){
                    order.$update({paymentStatus: 'over'});
                }
            });

        },

        // Catalog API
        createShop: function(name, catalogBranch, cacheBranch){
            var defer = $q.defer();

            if(typeof catalogBranch === 'undefined' || !catalogBranch){
                catalogBranch = system.api.fbSafeKey(name);
            }
            if(typeof cacheBranch === 'undefined' || !cacheBranch){
                cacheBranch = catalogBranch;
            }

            var shopsRoot = FBSHOPSROOT;
            var configPath = shopsRoot+'/config/'+system.api.fbSafeKey(name);
            var catalogPath = shopsRoot+'/catalog/'+catalogBranch;
            var cachePath = shopsRoot+'/cache/'+cacheBranch;

            var phaseProms = [];
            var cPhaseProm;

            cPhaseProm = system.api.fbSafePath(configPath);
            cPhaseProm.then(function(safePath){
                configPath = safePath;
            });
            phaseProms.push(cPhaseProm);

            cPhaseProm = system.api.fbSafePath(catalogPath);
            cPhaseProm.then(function(safePath){
                catalogPath = safePath;
            });
            phaseProms.push(cPhaseProm);

            cPhaseProm = system.api.fbSafePath(cachePath);
            cPhaseProm.then(function(safePath){
                cachePath = safePath;
            });
            phaseProms.push(cPhaseProm);

            $q.all(phaseProms).then(function(){
                phaseProms = [];

                var newCatalog = {
                    name: name,
                    children: {}
                };
                var newCache = {
                    name: name,
                    products: {}
                };


                var catalogDefer = $q.defer();
                firebaseRef(catalogPath).set(newCatalog, function(){
                    catalogDefer.resolve(true);
                });
                phaseProms.push(catalogDefer.promise);

                var cacheDefer = $q.defer();
                firebaseRef(cachePath).set(newCache, function(){
                    cacheDefer.resolve(true);
                });
                phaseProms.push(cacheDefer.promise);

                $q.all(phaseProms).then(function(){
                    var shopConfig = {
                        name: name,
                        catalog: catalogPath,
                        cache: cachePath,
                        inventory: 'product'
                    };

                    firebaseRef(configPath).set(shopConfig, function(error) {
                        if (!error) {
                            defer.resolve(shopConfig);
                        }
                        else {
                            defer.resolve(false);
                        }
                    });

                }, function(error){
                    defer.resolve(false);
                });

            }, function(error){
                defer.resolve(false);
            });

            return defer.promise;
        },
        loadShops: function(){
            var defer = $q.defer();
            data.shops = syncData('shops/config');
            data.shops.$on('loaded', function(){
                defer.resolve(data.shops);
            });
            /**var shopsRef = firebaseRef('shops/config');
            shopsRef.on('value', function(snap){
                defer.resolve(snap.val());
            });
            shopsRef.on('child_added', function(childSnapshot){
                data.shops[childSnapshot.name()] = childSnapshot.val();
            });
            shopsRef.on('child_removed', function(oldChildSnapshot){
                delete data.shops[oldChildSnapshot.name()];
            });
             */
            return defer.promise;
        },
        setActiveShop: function(browserID, shopName){
            var defer = $q.defer();
            if(shopName && data.shops[shopName]){
                api.getCatalogBrowser(browserID).then(function(browser){
                    browser.setShop(data.shops[shopName]);
                    defer.resolve(browser);
                });
            }
            else{
                defer.reject('Shop \''+shopName+'\' was not found.');
            }

            /**if(data.shops[shopName] && data.shops[shopName].catalog){
                api.getCatalogBrowser(browserID).then(function(){
                    api.loadCatalog(data.shops[shopName].catalog).then(function(catalog){
                        data.store.browser[browserID].setCatalog(catalog);
                        defer.resolve(data.store.browser[browserID]);
                    });
                });
            }
            else{
                defer.reject('Catalog is not configured for this shop.');
            }*/

            return defer.promise;
        },

        upcLookup: function(upc){
            var defer = $q.defer();
            if(upc){
                var upcLookup = firebaseRef(FBSHOPSROOT+'/upc/'+system.api.fbSafeKey(upc));
                upcLookup.once('value', function(snap){
                    defer.resolve(snap.val());
                });
            }
            else{
                defer.reject('Invalid UPC \''+upc+'\'');
            }

            return defer.promise;
        },

        setProduct: function(product){
            /**
             missing data strategy?
                1. require all data and save the whole product every time
             OR
                2. require only $id or upc and update provided fields
                    - if no $id or upc, it is new
             */

            /**
             product should be of format:
             product = {
                    $id: <system product ID>
                    upc: <universal product code>,
                    name: <product name>,
                    body: <product description>,
                    img: <product image>,
                    price: <retail price>,
                    taxID: <tax category ID>,
                    stock: <stock level>,
                    suppliers: [{name:<supplier name>, cost:<cost from supplier>, item:<supplier item ID>}],
                    shops: {<shopID>: {available:<true|false|stock> , categories:['<path/of/category>']}}
                };
             */

            var productID = product.$id;
            if(product.$id){
                // take it out for when we store product object in DB (we don't want to save $id as a child)
                delete product.$id;
            }

            var upcDefer = $q.defer();
            api.upcLookup(product.upc).then(function(upcProdID){
                if(upcProdID){
                    if(upcProdID === productID){
                        upcDefer.resolve('match');
                    }
                    else if(!productID){
                        productID = upcProdID;
                        upcDefer.resolve('found');
                    }
                    else{
                        upcDefer.resolve('duplicates');
                    }
                }
                else{
                    upcDefer.resolve('new');
                }
            },function(error){
                upcDefer.resolve('invalid');
            });

            upcDefer.promise.then(function(upcStatus){
                if(!productID){
                    product.new = true;
                }

                var invSetting = { defer: $q.defer(), addingTo: '', invQueue: {} };
                angular.forEach(product.shops, function(shopProduct, shopID) {
                    var shopConfig = data.shops[shopID];
                    if(shopConfig) {
                        var inventory = firebaseRef(shopConfig.inventory);
                        if(!productID){
                            // this bit of invSetting does the push on only the first inventory table
                            // and saves a list of additional inventories to add the product into
                            // this allows for the same fb-generated procuctID to be shared in multiple inventory tables
                            if(!invSetting.addingTo){
                                invSetting.addingTo = shopConfig.inventory;
                                var newProdRef = inventory.push(product, function(error){
                                    if(error){ /* error handling */ }
                                    productID = newProdRef.name();
                                    invSetting.defer.resolve();
                                });
                            }
                            else if(shopConfig.inventory !== invSetting.addingTo && !invSetting.invQueue[shopConfig.inventory]){
                                invSetting.invQueue[shopConfig.inventory] = true;
                            }
                        }
                        else{
                            // update "shared inventory" at inventory.child(product.id)
                            inventory.child(productID).update(product, function(error){
                                if(error){ /* error handling */ }
                                invSetting.defer.resolve();
                            });
                        }

                        invSetting.defer.promise.then(function(){
                            angular.forEach(invSetting.invQueue, function(addTo, inventoryPath){
                                var cInventory = firebaseRef(inventoryPath);
                                cInventory.child(productID).update(product);
                            });

                            // handle flat-list caching for searching
                            var cachedProduct = firebaseRef(shopConfig.cache+'/products/'+productID);
                            if (shopProduct.available === true || (shopProduct.available === 'stock' && product.stock > 0)) {
                                cachedProduct.set(product);
                            }
                            else{
                                cachedProduct.remove();
                            }

                            if(shopProduct.categories.length){
                                var catalog = firebaseRef(shopConfig.catalog);
                                angular.forEach(shopProduct.categories, function(catPath, catIdx){
                                    // insert product into catalog at catPath
                                    if(catPath.charAt(catPath.length-1) !== '/'){ catPath += '/'; } // ensure trailing /children/
                                    if(catPath.charAt(0) !== '/'){ catPath = '/'+catPath; } // ensure leading /children/

                                    var catParts = catPath.split('/');
                                    var cCatPath = '';
                                    angular.forEach(catParts, function(cCatPiece, catIdx){
                                        if(cCatPiece){
                                            cCatPath += '/children/'+system.api.fbSafeKey(cCatPiece);
                                            catalog.child(cCatPath).update({name: cCatPiece});
                                        }
                                    });
                                    cCatPath += '/children/'+productID;
                                    catalog.child(cCatPath).update({name: product.name, url: system.api.fbSafeKey(product.name)});
                                });
                            }
                        });
                    }
                });

                invSetting.defer.promise.then(function(){
                    var upcRoot = firebaseRef(FBSHOPSROOT+'/upc');
                    if(upcStatus === 'new'){
                        upcRoot.child(system.api.fbSafeKey(product.upc)).set(productID);
                    }
                    else if(upcStatus === 'duplicates' || upcStatus === 'invalid'){
                        upcRoot.child(upcStatus+'/'+system.api.fbSafeKey(product.upc?product.upc:'?')+'/'+productID).set(product.upc);
                    }
                });
            });

            // TODO: maybe add supplier to "suppliers" table if it doens't exist already?
            /**
            angular.forEach(product.suppliers, function(supplier, supplierID){
            });
             */
        },

        getCatalogBrowser: function(browserID, shopName){
            var defer = $q.defer();
            if(!data.store.browser[browserID]){
                data.store.browser[browserID] = new CatalogBrowser();
                if(shopName && data.shops[shopName]){
                    data.store.browser[browserID].setShop(data.shops[shopName]);
                }
                defer.resolve(data.store.browser[browserID]);
            }
            else{
                defer.resolve(data.store.browser[browserID]);
            }
            return defer.promise;
        },

        loadCatalog: function(name, forceReload){
            var defer = $q.defer();
            if(typeof name === 'undefined'){
                name = 'shop';
            }
            if(typeof forceReload === 'undefined'){
                forceReload = false;
            }

            if(!data.store.catalogs[name] || forceReload){
                var catalogLoad = syncData(name);
                catalogLoad.$on('loaded', function(){
                    //data.store.catalogs[name] = $filter('orderByPriority')(catalogLoad);
                    data.store.catalogs[name] = catalogLoad;
                    defer.resolve(data.store.catalogs[name]);
                });
            }
            else{
                defer.resolve(data.store.catalogs[name]);
            }
            return defer.promise;
        },

        loadInventoryProduct: function(productID, inventoryPath){
            if(typeof inventoryPath === 'undefined'){
                inventoryPath = '';
            }
            var defer = $q.defer();

            if(!data.store.products[inventoryPath]){
                data.store.products[inventoryPath] = {};
            }

            if(!data.store.products[inventoryPath][productID]){
                var productLoad = syncData(inventoryPath+'/'+productID);
                productLoad.$on('loaded', function(){
                    data.store.products[inventoryPath][productID] = productLoad;
                    if(data.store.products[inventoryPath][productID].$value === null || !data.store.products[inventoryPath][productID].name){
                        data.store.products[inventoryPath][productID] = null;
                    }
                    defer.resolve(data.store.products[inventoryPath][productID]);
                });
            }
            else{
                defer.resolve(data.store.products[inventoryPath][productID].name?data.store.products[inventoryPath][productID]:null);
            }
            return defer.promise;
        },

        /**
         * loads a list of inventory products
         * productList should be of format:
         *  [productID] = product
         *
         * if product has a property 'children', it will be skipped
         */
        loadInventoryProducts: function(productList, inventoryPath){
            if(typeof inventoryPath === 'undefined'){
                inventoryPath = '';
            }
            var defer = $q.defer();
            var productLoads = [];
            angular.forEach(productList, function(product, productID){
                if(product && !product.children){
                    productLoads.push(api.loadInventoryProduct(productID, inventoryPath));
                }
            });
            if(productLoads.length){
                $q.all(productLoads).then(function(results){
                    defer.resolve();
                });
            }
            else{
                defer.resolve();
            }
            return defer.promise;
        },

        unloadInventoryProduct: function(productID, inventoryPath){
            if(data.store.products[inventoryPath] && data.store.products[inventoryPath][productID]){
                delete data.store.products[inventoryPath][productID];
            }
        },

        unloadInventoryProducts: function(productList, inventoryPath){
            angular.forEach(productList, function(product, productID){
                api.unloadInventoryProduct(productID, inventoryPath);
            });
        },

        loadShopCatalog: function(shopName){
            var defer = $q.defer();
            if(shopName && data.shops[shopName] && data.shops[shopName].catalog){
                api.loadCatalog(data.shops[shopName].catalog).then(function(catalog){
                    defer.resolve(catalog);
                });
            }
            else{
                defer.reject('Could not load catalog for shop \''+shopName+'\'.');
            }
            return defer.promise;
        },

        loadShopInventory: function(shopName){
            var defer = $q.defer();
            if(shopName && data.shops[shopName] && data.shops[shopName].inventory) {
                var inventoryPath = data.shops[shopName].inventory;
                if(data.store.inventory[inventoryPath]){
                    defer.resolve(data.store.inventory[inventoryPath]);
                }
                else{
                    firebaseRef(inventoryPath).once('value', function(snap){
                        data.store.inventory[inventoryPath] = $filter('orderByPriority')(snap.val());
                        defer.resolve(data.store.inventory[inventoryPath]);
                    });

                    /**var inventorySheet = syncData(inventoryPath);
                    inventorySheet.$on('loaded', function(){
                        data.store.inventory[inventoryPath] = $filter('orderByPriority')(inventorySheet);
                        defer.resolve(data.store.inventory[inventoryPath]);
                    });*/
                }
            }
            else{
                defer.reject('Could not load inventory for shop \''+shopName+'\'.');
            }
            return defer.promise;
        },

        unloadShopInventory: function(shopName){
            if(shopName && data.shops[shopName] && data.shops[shopName].inventory && data.store.inventory[data.shops[shopName].inventory]){
                delete data.store.inventory[data.shops[shopName].inventory];
            }
        }



    };

	var shop = {
        api: api,
        data: data
    };

	return shop;
});