angular.module('ecoposApp').directive('userInfo', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/userInfo/userInfo.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
