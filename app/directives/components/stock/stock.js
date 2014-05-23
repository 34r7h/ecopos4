angular.module('ecoposApp').directive('stock', function($q, $log, $timeout, system, shop, firebaseRef) {
	return {
		restrict: 'E',
		replace: true,
		scope:'@',
		templateUrl: 'app/directives/components/stock/stock.html',
		link: function(scope, element, attrs, fn) {
			scope.sortables=[
				{name:'name','show':true, type:'text', priority:1},
				{name:'stock',show:false, type:'number', priority:5},
				{name:'price',show:false, type:'number', priority:3},
				{name:'category',show:false, type:'text', priority:7},
				{name:'suppliers',show:false, type:'text', priority:10}
			];
            scope.show = {
                stock: true,
                import: false,
                createShop: false
            };
            scope.stockShow = function(what){
                angular.forEach(scope.show, function(val, key){
                    scope.show[key] = (key === what);
                });
            };

            scope.shops = shop.data.shops;

            scope.selectedCats = {};

            // filtering
            scope.filters = {
                matchAll: true,
                changedProducts: false,
                name: '',
                nameExact: false,
                upc: '',
                upcExact: true,
                priceLow: 0,
                priceHigh: 0,
                stockLow: 1,
                stockHigh: 0
            };
            scope.filterArgs = function(){
                var args = [];

                if(scope.selectedCats){
                    var selectCats = [];
                    angular.forEach(scope.selectedCats, function(selected, catName){
                        if(selected){
                            selectCats.push(catName);
                        }
                    });
                    if(selectCats.length){
                        args.push({
                            field: 'shops[\''+scope.invShop+'\'].categories',
                            match: 'containsAny',
                            value: selectCats
                        });
                    }
                }

                if(scope.filters.changedProducts){
                    args.push({
                        field: '$id',
                        match: 'contains',
                        value: Object.keys(scope.changedProducts)
                    });
                }
                if(scope.filters.name){
                    args.push({
                        field: 'name',
                        match: scope.filters.nameExact?'==':'contains',
                        value: scope.filters.name
                    });
                }
                if(scope.filters.upc){
                    args.push({
                        field: 'upc',
                        match: scope.filters.upcExact?'=':'contains',
                        value: scope.filters.upc
                    });
                }
                if(scope.filters.priceLow && scope.filters.priceHigh && scope.filters.priceHigh >= scope.filters.priceLow){
                    args.push({
                        field: 'price',
                        match: ['>=', '<='],
                        value: [scope.filters.priceLow, scope.filters.priceHigh]
                    });
                }
                else if(scope.filters.priceHigh){
                    args.push({
                        field: 'price',
                        match: '<=',
                        value: scope.filters.priceHigh
                    });
                }
                else if(scope.filters.priceLow){
                    args.push({
                        field: 'price',
                        match: '>=',
                        value: scope.filters.priceLow
                    });
                }

                if(scope.filters.stockLow && scope.filters.stockHigh && scope.filters.stockHigh >= scope.filters.stockLow){
                    args.push({
                        field: 'stock',
                        match: ['>=', '<='],
                        value: [scope.filters.stockLow, scope.filters.stockHigh]
                    });
                }
                else if(scope.filters.stockLow){
                    args.push({
                        field: 'stock',
                        match: '>=',
                        value: scope.filters.stockLow
                    });
                }
                else if(scope.filters.stockHigh){
                    args.push({
                        field: 'stock',
                        match: '<=',
                        value: scope.filters.stockHigh
                    });
                }
                return args;
            };

            // product management
            scope.changedProducts = {};
            scope.focusProduct = '';
            scope.focusField = '';
            scope.changedProductsCount = function(){
                return (scope.changedProducts?Object.keys(scope.changedProducts).length:0);
            };
            scope.productChanged = function(productID, changedField){
                if(!scope.changedProducts[productID]){
                    scope.changedProducts[productID] = [];
                }
                if(scope.changedProducts[productID].indexOf(changedField) === -1){
                    scope.changedProducts[productID].push(changedField);
                }
            };
            scope.productFocus = function(productID, focusField){
                scope.focusProduct = productID;
                scope.focusField = focusField;
            };
            scope.productBlur = function(productID, blurField){
                if(scope.focusProduct === productID){
                    scope.focusProduct = '';
                }
            };


            // inventory table
            scope.invShop = '';
            scope.productOrder = '';
            scope.productReverse = false;
            scope.productCount = function(){
                return (scope.inventory?Object.keys(scope.inventory).length:0);
            };
            scope.shopSelected = function(){
                if(scope.invShop){
                    console.log('load shop '+scope.invShop);
                    shop.api.loadShopInventory(scope.invShop).then(function(inventory){
                        scope.inventory = inventory;
                    });
                    shop.api.loadShopCatalog(scope.invShop).then(function(catalog){
                        scope.catalog = catalog;
                    });
                }
            };
            scope.sortBy = function(key){
                if(key === 'category'){
                    key = 'shops[\''+scope.invShop+'\'].categories[0]';
                }
                if(scope.productOrder === key){
                    scope.productReverse = !scope.productReverse;
                }
                else{
                    scope.productOrder = key;
                    scope.productReverse = false;
                }
            };

            // importing
            scope.importHistory = [];
            scope.importShop = '';
            scope.startImport = function(){
                if(!scope.importing && scope.import && scope.importers[scope.import] && typeof scope.importers[scope.import].import === 'function' && scope.importShop){
                    var impShops = {};
                    var shopsStr = '';
                    angular.forEach(scope.importShop, function(cShop){
                        if(scope.shops[cShop]){
                            impShops[cShop] = scope.shops[cShop];
                            shopsStr += (shopsStr?', ':'')+'\''+scope.shops[cShop].name+'\'';
                        }
                    });

                    scope.importing = {import: scope.importers[scope.import], shop: impShops, startTime: system.api.currentTime()};

                    $log.debug('importing \''+scope.importers[scope.import].name+'\' from \''+scope.importers[scope.import]['raw-table']+'\' to '+shopsStr);

                    scope.importers[scope.import].import(impShops).then(function(){
                        scope.importing.finishTime = system.api.currentTime();
                        scope.importHistory.push({name: scope.importing.import.name, shop: impShops, start: scope.importing.startTime, finish: scope.importing.finishTime});
                        scope.importing = false;
                    });
                }
            };

            scope.importing = false;
            scope.import = '';
            scope.importers = {
                'inventory': {
                    name: 'Inventory Sheet',
                    'raw-table': 'inventory-may13',
                    import: function(shopConfigs){
                        var defer = $q.defer();

                        var rawData = firebaseRef(this['raw-table']);
                        rawData.once('value', function(snap) {
                            var inv = snap.val();
                            if(inv) {
                                $log.debug('found '+inv.length+' products to import');

                                var invCount = 0;
                                angular.forEach(inv, function(prod, prodIdx) {
                                    var cSuppliers = [];

                                    var supNum = 1;
                                    while (supNum <= 4) {
                                        if (prod['supplier' + supNum + ' name']) {
                                            cSuppliers.push({
                                                name: prod['supplier' + supNum + ' name'],
                                                cost: prod['supplier' + supNum + ' cost'],
                                                item: prod['supplier' + supNum + ' itemnumber']
                                            });
                                        }
                                        supNum++;
                                    }

                                    var cCat = '';
                                    cCat += prod['department'];
                                    cCat += (cCat?'/':'')+prod['category'];

                                    var cShops = {};
                                    angular.forEach(shopConfigs, function(intoShop, shopID){
                                        cShops[shopID] = {
                                            available: 'stock',
                                            categories: [cCat]
                                        };
                                    });

                                    var cProd = {
                                        upc: prod['upc'],
                                        name: prod['description'],
                                        price: prod['retail'],
                                        taxID: prod['taxid'],
                                        stock: prod['stock'],
                                        suppliers: cSuppliers,
                                        shops: cShops
                                    };

                                    shop.api.setProduct(cProd);
                                    invCount++;
                                });
                            }
                            defer.resolve(true);
                        });

                        return defer.promise;
                    }
                },
                'horizon': {
                    'name': 'Horizon',
                    'raw-table': 'horizon-products',
                    import: function(shopConfigs){
                        var defer = $q.defer();

                        angular.forEach(shopConfigs, function(intoShop, shopID){
                            console.log('import horizon into '+intoShop.name+' ('+intoShop.catalog+')');
                        });

                        $timeout(function(){ defer.resolve(); }, 2567);

                        return defer.promise;
                    }
                }
            };


			// Shop Maker stuff
			scope.shopName = '';
			scope.shopCatalogBranch = '';
			scope.shopCatalogBranchMod = false;
			scope.shopCacheBranch = '';
			scope.shopCacheBranchMod = false;
			scope.mess = '';

			scope.createShop = function(){
				shop.api.createShop(scope.shopName).then(function(success){
					if(success){
						scope.mess = 'shop created successfully!';
						scope.shopName = '';
						scope.shopCatalogBranch = '';
						scope.shopCatalogBranchMod = false;
						scope.shopCacheBranch = '';
						scope.shopCacheBranchMod = false;
					}
				}, function(error){
					scope.mess = 'error creating shop: \''+error+'\'';
				});
			};

			scope.autoBranchName = function(){
				if(!scope.shopCatalogBranchMod){
					scope.shopCatalogBranch = system.api.fbSafeKey(scope.shopName);
				}
				if(!scope.shopCacheBranchMod){
					scope.shopCacheBranch = system.api.fbSafeKey(scope.shopName);
				}
			};

		}
	};
});
