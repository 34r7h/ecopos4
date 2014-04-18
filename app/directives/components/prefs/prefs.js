angular.module("ecoposApp").directive("prefs", function(){
		return {
			restrict:"E",
			scope:{element:"=", type:"=", name:"="},
			link:function(scope, iElem, iAttrs) {
				console.log(scope.element,scope.type);
				var domElement = document.createElement(scope.element);
				domElement.type = scope.type;
				iElem.append(domElement);

			}
		};
	}
);