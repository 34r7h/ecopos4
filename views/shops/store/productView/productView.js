angular.module('ecoposApp').directive('productView', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/shops/store/productView/productView.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
