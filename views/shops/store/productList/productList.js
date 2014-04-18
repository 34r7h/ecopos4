angular.module('ecoposApp').directive('productList', function(system) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/shops/store/productList/productList.html',
		link: function(scope, element, attrs, fn) {
            scope.saveProduct = system.api.saveProduct;
            scope.isCategory = function(item){
                return (item.children);
            };
            scope.isProduct = function(item){
                return !(item.children);
            };
		}
	};
});
