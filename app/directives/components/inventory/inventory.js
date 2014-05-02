angular.module('ecoposApp').directive('inventory', function($q, $log, $timeout, system, shop) {
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
                if(!scope.importing && scope.import && typeof scope.import.import === 'function' && scope.importShop){
                    scope.importing = {import: scope.import, shop: scope.importShop, startTime: system.api.currentTime()};
                    $log.debug('importing \''+scope.import.name+'\' from \''+scope.import['raw-table']+'\' to \''+scope.importShop.name+'\' ('+scope.importShop.catalog+')');

                    scope.import.import(scope.importShop).then(function(){
                        scope.importing.finishTime = system.api.currentTime();
                        scope.importHistory.push({name: scope.importing.import.name, shop: scope.importing.shop, start: scope.importing.startTime, finish: scope.importing.finishTime});
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
                    import: function(intoShop){
                        var defer = $q.defer();

                        console.log('import inventory into '+intoShop.name+' ('+intoShop.catalog+')');

                        $timeout(function(){ defer.resolve(); }, 1000);

                        return defer.promise;
                    }
                },
                'horizon': {
                    'name': 'Horizon',
                    'raw-table': 'horizon-products',
                    import: function(intoShop){
                        var defer = $q.defer();

                        console.log('import horizon into '+intoShop.name+' ('+intoShop.catalog+')');

                        $timeout(function(){ defer.resolve(); }, 2567);

                        return defer.promise;
                    }
                }
            };

		}
	};
});
