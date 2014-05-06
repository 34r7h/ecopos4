angular.module('ecoposApp').directive('inventory', function($q, $log, $timeout, system, shop, firebaseRef) {
	return {
		restrict: 'E',
		replace: true,
		scope:'@',
		templateUrl: 'app/directives/components/inventory/inventory.html',
		link: function(scope, element, attrs, fn) {
            scope.shops = shop.data.shops;
            scope.importShop = '';

            scope.importHistory = [];

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
                    'raw-table': 'inventory-apr19',
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

		}
	};
});
