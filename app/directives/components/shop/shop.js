angular.module('ecoposApp').directive('shop', function(system, $rootScope, shop) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/shop/shop.html',
		link: function(scope, element, attrs, fn) {
			scope.qty = 1;
			// handle catalog browsing
			//scope.inventory = system.data.store.products;
			// load the catalog for the main CatalogBrowser

            scope.shop = shop.data.store.browser['shop'];

            scope.saveProduct = system.api.saveProduct;
            scope.isCategory = function(item){
                return (item.name && item.children);
            };
            scope.isProduct = function(item){
                return (item.name && !(item.children));
            };
		}
	};
});
