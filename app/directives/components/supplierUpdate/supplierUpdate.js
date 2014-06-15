angular.module('ecoposApp').directive('supplierUpdate', function(imports) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/supplierUpdate/supplierUpdate.html',
		link: function(scope, element, attrs, fn) {
            scope.imports = imports.data;
            scope.import = imports.api.import;
		}
	};
});
