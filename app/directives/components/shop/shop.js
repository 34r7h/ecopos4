angular.module('ecoposApp').directive('shop', function(shop) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/shop/shop.html',
		link: function(scope, element, attrs, fn) {
            scope.saveProduct = shop.api.saveProduct;
            scope.isCategory = function(item){
                return (item.name && item.children);
            };
            scope.isProduct = function(item){
                return (item.name && !(item.children));
            };
		}
	};
});
