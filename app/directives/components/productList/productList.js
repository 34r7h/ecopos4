angular.module('ecoposApp').directive('productList', function(system) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/productList/productList.html',
		link: function(scope, element, attrs, fn) {
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
