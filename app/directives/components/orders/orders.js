angular.module('ecoposApp').directive('orders', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/orders/orders.html',
		link: function(scope, element, attrs, fn, syncData) {


		}
	};
});
