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
                if(!scope.importing && scope.import && scope.importers[scope.import] && typeof scope.importers[scope.import].import === 'function'){
                    scope.importing = {import: scope.importers[scope.import], startTime: system.api.currentTime()};
                    $log.debug('importing \''+scope.importers[scope.import].name+'\' from \''+scope.importers[scope.import]['raw-table']+'\'');

                    scope.importers[scope.import].import().then(function(){
                        scope.importing.finishTime = system.api.currentTime();
                        scope.importHistory.push({name: scope.importing.import.name, start: scope.importing.startTime, finish: scope.importing.finishTime});
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
                    import: function(){
                        var defer = $q.defer();

                        $timeout(function(){ defer.resolve(); }, 1000);

                        return defer.promise;
                    }
                },
                'horizon': {
                    'name': 'Horizon',
                    'raw-table': 'horizon-products',
                    import: function(){
                        var defer = $q.defer();

                        $timeout(function(){ defer.resolve(); }, 2567);

                        return defer.promise;
                    }
                }
            };

		}
	};
});
