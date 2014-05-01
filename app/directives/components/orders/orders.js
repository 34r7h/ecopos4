angular.module('ecoposApp').directive('orders', function($filter, $q, ngTableParams) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/orders/orders.html',
		link: function($scope, scope, element, attrs, fn, syncData) {

		}
	};
});
