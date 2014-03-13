angular.module('ecoposApp').directive('messages', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/tools/tool/messages/messages.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
