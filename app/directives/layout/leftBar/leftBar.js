angular.module('ecoposApp').directive('leftBar', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
