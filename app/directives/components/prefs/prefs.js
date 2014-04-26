angular.module("ecoposApp").directive("prefs", function(){
		return {
			restrict:"E",
			scope:{element:"=", type:"=", model:"=ngModel"},
			link:function(scope, iElem, iAttrs) {
				var domElement = document.createElement(scope.element);
				domElement.type = scope.type;
				domElement.ngModel = scope.name;
				iElem.append(domElement);
				console.log(iAttrs);

			}
		};
	}
);