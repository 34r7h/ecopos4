angular.module('ecoposApp').directive('cart', function(shop) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/cart/cart.html',
		link: function($scope, element, attrs, fn) {
			$scope.addProduct = shop.api.addProduct;
			$scope.removeItem = shop.api.removeItem;
			$scope.total = shop.api.cartTotal;

			$scope.cart = shop.data.cart;
			$scope.invoice = shop.data.invoice;
			$scope.items = shop.data.invoice.items;

		}
	};
});
