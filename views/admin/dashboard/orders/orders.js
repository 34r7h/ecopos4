angular.module('ecoposApp').directive('orders', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/admin/dashboard/orders/orders.html',
		link: function(scope, element, attrs, fn, syncData) {


		}
	};
});
