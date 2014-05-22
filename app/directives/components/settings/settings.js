angular.module('ecoposApp').directive('settings', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/settings/settings.html',
		link: function(scope, element, attrs, fn) {
            scope.inputSettings = {};

		}
	};
});
