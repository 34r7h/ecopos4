angular.module('ecoposApp').directive('supplierUpdate', function(system, $timeout) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/supplierUpdate/supplierUpdate.html',
		link: function(scope, element, attrs, fn) {

		}
	};
});
