angular.module('ecoposApp').directive('test', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'test/directive/test.html',
		link: function(scope, element, attrs) {

		}
	};
});
