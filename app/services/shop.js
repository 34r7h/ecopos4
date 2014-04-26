angular.module('ecoposApp').factory('shop',function($q, syncData, firebaseRef, $filter, FBURL, $log) {
    var data = {
        store: {products: {}, catalogs: {}, browser: {}},

        cart: {},
        invoice: { items:{} }
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
                public.path.length = 0;
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
        addProduct: function(sku, qty,unitType,name,price,img) {
            if(data.invoice.items[sku]){
                data.invoice.items[sku].qty += qty;
            } else {
                data.invoice.items[sku] = {
                    sku: sku,
                    qty: qty,
                    unitType: unitType,
                    name: name,
                    price: price,
                    img: img
                };
            }

        },
        addItem: function() {
            data.invoice.items.push({
                qty: 1,
                unitType:'',
                name: '',
                price: 0,
                img: ''
            });
        },
        removeItem: function(sku) {
            delete data.invoice.items[sku];
        },
        cartTotal: function() {
            var total = 0;
            angular.forEach(data.invoice.items, function(item) {
                total += item.qty * item.price;
            });

            return total;
        },

        // Catalog API
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