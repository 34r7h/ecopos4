angular.module('ecoposApp').directive('topBar', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/layout/topBar/topBar.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
