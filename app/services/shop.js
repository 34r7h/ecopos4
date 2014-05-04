angular.module('ecoposApp').factory('shop',function($q, system, syncData, firebaseRef, $firebase, $filter, FBURL, FBSHOPSROOT, $log) {
    var data = {
        store: {products: {}, catalogs: {}, browser: {}},
        shops: {},

        invoice: { order: {}, orderRef: null, items:{}, delivery: false }
    };

    var CatalogBrowser = function(newCatalog){
        if(typeof newCatalog === 'undefined'){
            newCatalog = null;
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
                        crumbs.unshift(catalogRef.name());
                    }
                }
                //public.path.length = 0;
                while(public.path.length > 0) { public.path.pop(); }
                angular.forEach(crumbs, function(crumb, crumbID){
                    crumble.push(crumb);
                    var cPath = '/'+crumble.slice(1).join('/');
                    var fbRef = syncData(crumble.join('/children/')+'/name');
                    public.path.push({
                        name: fbRef,
                        path: cPath
                    });
                });
            },

            setCategory: function(category) {
                var defer = $q.defer();

                if(category.children){
                    public.category = category;
                    public.pathStr = private.getPathForCatalogRef(category.$getRef());
                    public.product = null;
                    public.productURI = '';
                    api.loadInventoryProducts(category.children);
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
            category: null,
            product: null,
            path: [],

            pathStr: '/',
            productURI: '',

            getPathURI: function(){
                return public.pathStr+((public.pathStr.charAt(public.pathStr.length-1)!=='/' && public.productURI.charAt(0) !=='/')?'/':'')+public.productURI;
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
                api.loadInventoryProduct(productID).then(function(product){
                    public.product = product;
                    defer.resolve(product);
                });
                return defer.promise;
            }
        };

        public.setCatalog(newCatalog);

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
                api.loadInventoryProduct(productID).then(function(product){
                    if(product) {
                        delete data.invoice.items[productID];
                        api.updateOrder({items: data.invoice.items});
                    }
                });
            }
        },
        changeProductQty: function(productID){
            if(data.invoice.items[productID] && data.invoice.order.items[productID]){
                api.loadInventoryProduct(productID).then(function(product) {
                    if(product){
                        if(product.stock){
                            if(product.stock < data.invoice.items[productID].qty){
                                data.invoice.items[productID].qty = product.stock;
                            }
                        }
                        api.updateOrder({items: data.invoice.items});
                    }
                });
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
            var shopsRef = firebaseRef('shops/config');
            shopsRef.on('child_added', function(childSnapshot){
                data.shops[childSnapshot.name()] = childSnapshot.val();
            });
            shopsRef.on('child_removed', function(oldChildSnapshot){
                delete data.shops[oldChildSnapshot.name()];
            });
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
             product may be a $firebase object - or of the format:
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

            var shopsRoot = FBSHOPSROOT;

            var upcProdID = '';
            var upcCachePath = shopsRoot+'/upc';
            var upcFound = false;
            if(product.upc){ // && product.upc.test(/[0-9]{12}/)

                // TODO: make an api.upcLookup(upc, restrictShop?) promise

                firebaseRef(upcCachePath+'/'+product.upc).once('value', function(snap){
                    upcProdID = snap.val();
                    if(upcProdID){
                        if(upcProdID === product.$id){
                            // UPC matches product.$id
                            upcFound = true;

                            // - this means that the product is in the catalog with a valid UPC
                            // - match it for updating when we are handling the shops
                        }
                        else{
                            // UPC found, but not matching product.$id

                            // - if product.$id
                            //      - insert as array 'upc/'+product.upc = product.$id
                            //
                            // - else if !product.$id
                            //      - insert it when we are handling the shops
                            //          - insert product to generate $id
                            //          - insert as array 'upc/'+product.upc = product.$id
                            //      - or retrieve the upcProdID and update the product
                            //          - make some checks to ensure it is the "same" product
                            //              (ex. name, price, shops/categories)

                            upcFound = product.$id?'multi':'new';
                        }
                    }
                    else{
                        // UPC not found in upc table

                        // - if product.$id
                        //      - insert 'upc/'+product.upc = product.$id
                        // - else if !product.$id
                        //      - insert it when we are handling the shops
                        //          - insert product to generate $id
                        //          - insert 'upc/'+product.upc = product.$id

                        if(product.$id){
                            //      - insert 'upc/'+product.upc = product.$id
                        }
                        else{
                            upcFound = 'new';
                        }
                    }
                });
            }
            else{
                // no UPC or invalid UPC
                // save to upc/invalid/<(product.upc?product.upc:'undefined')>
            }

            if(!product.$id){
                product.new = true;
            }

            angular.forEach(product.shops, function(shopProduct, shopID){
                var shopConfig = data.shops[shopID];
                if(shopConfig) {
                    var inventory = firebaseRef(shopConfig.inventory);

                    if(!product.$id){
                        // add to "shared inventory" at inventory.push(product)
                    }
                    else{
                        // update "shared inventory" at inventory.child(product.id)
                    }



                    if (shopProduct.available === true || (shopProduct.available === 'stock' && product.stock > 0)) {
                        var cache = firebaseRef(shopConfig.cache);
                        // cache the product
                    }
                    // else if(product is in store's cache and shouldn't be){
                    //      remove it
                    // }

                    if(shopProduct.categories.length){
                        var catalog = firebaseRef(shopConfig.catalog);
                        angular.forEach(shopProduct.categories, function(catPath, catIdx){
                            // insert product into catalog at catPath
                        });
                    }
                }
            });

            // TODO: maybe add supplier to "suppliers" table if it doens't exist already?
            /**
            angular.forEach(product.suppliers, function(supplier, supplierID){
            });
             */
        },


        addCatalogBrowser: function(name, catalogName){
            var defer = $q.defer();
            if(!data.store.browser[name]){
                data.store.browser[name] = new CatalogBrowser();
                api.loadCatalog(catalogName).then(function(catalog){
                    data.store.browser[name].setCatalog(catalog);
                    defer.resolve(data.store.browser[name]);
                });
            }
            else{
                defer.resolve(data.store.browser[name]);
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

        resetInventoryCache: function(){
            console.log('%chas '+Object.keys(data.store.products).length+' products $firebinded!', 'background-color:#222;color:#09f;font-size:1.75em');
            for (var prop in data.store.products) { if (data.store.products.hasOwnProperty(prop)) { delete data.store.products[prop]; } }
            console.log('%cnow '+Object.keys(data.store.products).length+' products $firebinded!', 'background-color:#222;color:#90f;font-size:1.24');
        },

        loadInventoryProduct: function(productID){
            var defer = $q.defer();
            if(!data.store.products[productID]){
                var productLoad = syncData('product/'+productID);
                productLoad.$on('loaded', function(){
                    data.store.products[productID] = productLoad;
                    if(data.store.products[productID].$value === null || !data.store.products[productID].name){
                        data.store.products[productID] = null;
                    }
                    defer.resolve(data.store.products[productID]);
                });
            }
            else{
                defer.resolve(data.store.products[productID].name?data.store.products[productID]:null);
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
        loadInventoryProducts: function(productList){
            var defer = $q.defer();
            var productLoads = [];
            angular.forEach(productList, function(product, productID){
                if(product && !product.children){
                    productLoads.push(api.loadInventoryProduct(productID));
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

        saveProduct: function(product){
            product.$save();
        }
    };

	var shop = {
        api: api,
        data: data
    };

	return shop;
});