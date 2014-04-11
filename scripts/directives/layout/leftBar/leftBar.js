angular.module('ecoposApp').directive('leftBar', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'scripts/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
