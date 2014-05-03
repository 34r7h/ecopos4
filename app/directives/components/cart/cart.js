angular.module('ecoposApp').directive('cart', function(shop, system, $filter) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/cart/cart.html',
		link: function($scope, element, attrs, fn) {
            $scope.orders = system.data.user.orders;
            $scope.user = system.data.user; // needed for user.activeOrder binding
            $scope.activateOrder = function(){
                shop.api.loadOrder($scope.user.activeOrder);
            };

			$scope.addProduct = shop.api.addProduct;
			$scope.removeItem = shop.api.removeItem;
            $scope.productQty = shop.api.changeProductQty;
			$scope.total = shop.api.cartTotal;
            $scope.checkout = shop.api.orderCheckout;

			$scope.invoice = shop.data.invoice;
			$scope.items = shop.data.invoice.items;

			$scope.qtyCheck = function(data, productID) {
				console.log(data);
				if (isNaN(data)===true) {
					return "Quantity should be a number";
				}
				this.data = data;
                $scope.productQty(productID);
			};

		}
	};
});
