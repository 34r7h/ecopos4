angular.module('ecoposApp').directive('cart', function(shop) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/cart/cart.html',
		link: function($scope, element, attrs, fn) {
			$scope.addProduct = shop.api.addProduct;
			$scope.removeItem = shop.api.removeItem;
            $scope.productQty = shop.api.changeProductQty;
			$scope.total = shop.api.cartTotal;
            $scope.checkout = shop.api.orderCheckout;

			$scope.invoice = shop.data.invoice;
			$scope.items = shop.data.invoice.items;

			$scope.qtyCheck = function(data) {
				console.log(data);
				if (isNaN(data)===true) {
					return "Quantity should be a number";
				}
				this.data = data;
			};

		}
	};
});
