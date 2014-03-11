angular.module('ecoposApp').directive('cart', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'directive/cart/cart.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
