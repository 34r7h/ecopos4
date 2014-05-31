angular.module('ecoposApp').directive('orders', function($filter, $q, ngTableParams, system, shop) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/orders/orders.html',
		link: function(scope, element, attrs) {
			scope.total = shop.api.cartTotal;

            scope.orders = [];
            scope.userOrders = system.data.user.orders;
            scope.employeeOrders = system.data.employee.orders;
            scope.managerOrders = system.data.manager.orders;

            scope.combineOrders = function(){
                scope.orders = [];
                if(scope.userOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.userOrders));
                }
                if(scope.employeeOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.employeeOrders));
                }
                if(scope.managerOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.managerOrders));
                }
            };
            scope.$watchCollection('userOrders', scope.combineOrders);
            scope.$watchCollection('employeeOrders', scope.combineOrders);
            scope.$watchCollection('managerOrders', scope.combineOrders);
		}
	};
});
