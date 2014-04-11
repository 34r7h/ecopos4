angular.module('ecoposApp').directive('bottomBar', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'scripts/directives/layout/bottomBar/bottomBar.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
