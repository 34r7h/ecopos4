angular.module('ecoposApp').directive('leftBar', function(shop, system) {
	return {
		restrict: 'E',
		replace: false,
		transclude:true,
		templateUrl: 'app/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {

		}
	};
});