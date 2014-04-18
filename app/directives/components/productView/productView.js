angular.module('ecoposApp').directive('productView', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/productView/productView.html',
		link: function(scope, element, attrs, fn) {


		}
	};
});
