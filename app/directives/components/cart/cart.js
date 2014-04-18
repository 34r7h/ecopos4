angular.module('ecoposApp').directive('cart', function(system, cart) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/cart/cart.html',
		link: function($scope, element, attrs, fn) {
			$scope.addProduct = system.api.addProduct;
			$scope.removeItem = system.api.removeItem;
			$scope.total = system.api.total;

			$scope.cart = cart.cart;
			$scope.invoice = cart.invoice;
			$scope.items = cart.invoice.items;

		}
	};
});
