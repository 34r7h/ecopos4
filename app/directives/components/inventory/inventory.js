angular.module('ecoposApp').directive('inventory', function() {
	return {
		restrict: 'E',
		replace: true,
		scope:'@',
		templateUrl: 'app/directives/components/inventory/inventory.html',
		link: function(scope, element, attrs, fn) {
		}
	};
});
