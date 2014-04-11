angular.module('ecoposApp').directive('userInfo', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'scripts/directives/userInfo/userInfo.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
