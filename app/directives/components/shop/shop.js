angular.module('ecoposApp').directive('shop', function(system, $rootScope, shop, $location, $state) {
	return {
		restrict: 'E',
		replace: true,
		scope:'@',
		templateUrl: 'app/directives/components/shop/shop.html',
		link: function(scope, element, attrs, fn) {
            // catalog browsing
            //scope.shop = shop.data.store.browser['main'];
            shop.api.getCatalogBrowser('main').then(function(browser){
                scope.shop = browser;
            });

            // shopping
            scope.qty = 1;
            scope.addProduct = shop.api.addProduct;


            // management
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
