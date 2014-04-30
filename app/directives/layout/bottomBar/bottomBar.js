angular.module('ecoposApp').directive('bottomBar', function(system) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/layout/bottomBar/bottomBar.html',
		link: function(scope, element, attrs, fn, $scope) {

		}
	};
});
