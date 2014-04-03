angular.module('ecoposApp').directive('productList', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/shops/store/productList/productList.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
