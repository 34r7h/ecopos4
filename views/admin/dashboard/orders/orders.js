angular.module('ecoposApp').directive('orders', function() {
	return {
		restrict: 'E',
		replace: true,
		scope:true,
		templateUrl: 'views/admin/orders/orders.html',
		link: function(scope, element, attrs, fn, syncData) {


		}
	};
});
