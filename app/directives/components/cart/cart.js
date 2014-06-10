angular.module('ecoposApp').directive('cart', function(shop, system, $filter) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/cart/cart.html',
		link: function($scope, element, attrs, fn) {
			$scope.paymentMethods=[{name:'cash',type:'cash'},{name:'debit', type:'debit'},{name:'visa',type:'credit'},{name:'mastercard',type:'credit'},{name: 'gift certificate', type:'gift certificate'}];
            $scope.orders = system.data.user.orders;
            $scope.user = system.data.user; // needed for user.activeOrder binding
            $scope.activateOrder = function(){
                shop.api.loadOrder($scope.user.activeOrder).then(function(order){
                    $scope.order = shop.data.invoice.order;
                });
            };
            $scope.removeOrder = function(){
                if($scope.user.activeOrder){
                    shop.api.removeOrder($scope.user.activeOrder);
                }
            };

			$scope.addProduct = shop.api.addProduct;
			$scope.removeItem = shop.api.removeItem;
            $scope.productQty = shop.api.changeProductQty;
			$scope.total = shop.api.cartTotal;
            $scope.checkout = shop.api.orderCheckout;
            $scope.payAmt = 0.00;
			$scope.paymentMethod = '';
            $scope.makePayment = function(){
                // TODO: are we going to handle payAmt > total here?
                shop.api.orderPayment($scope.orders.$id, {type: $scope.paymentMethod, amount: $scope.payAmt});
            };

            $scope.order = shop.data.invoice.order;
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
