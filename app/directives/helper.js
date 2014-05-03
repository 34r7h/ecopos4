angular.module('ecoposApp').directive('comp', function($compile,$timeout) {
	return {
		restrict:"E",

		replace:true,
		scope:{element:"=",type:"=",calendar:"@calendar"},
		link:function(scope, iElem, iAttrs,element, $scope, attrs) {

			var domElement = document.createElement(scope.type || scope.element);
			if(scope.element){
				console.log(domElement);
				iElem.append(domElement);
				$compile(domElement)(scope);

			} else if (scope.type){
				console.log(domElement);
				iElem.append(domElement);

			}

		}
	};
}).directive('ecoPanel', function() {
	// ecoPanel is used to create component containers
	return {
		restrict: 'EA',
		replace: true,
		scope: false,
		transclude: true,
		template: function(elems, attrs) {
			var heading;
			heading = "";
			if (attrs.title || attrs.links) {
				heading = "<div class=\"panel-heading \"><span>\n  <h2 class=\"panel-title\">\n    " + attrs.title + "<span class=\"pull-right quarter-margin\" ng-repeat=\"icon in "+attrs.iconz+"\"><a href ng-click='icon.fun()'><i class=\" " + "{{icon.icon}}" + "\"></i></a></span>" + "\n</span></div>";
			}
			return "<div><div class=\"panel\">\n  " + heading + "\n  <div ng-style=\"{'max-height':dirDim.panelBodyHeight,'min-height':dirDim.panelBodyMinHeight}\" class=\"panel-body side-panels\">\n     <div class=\"\"><div ng-transclude></div></div>\n  </div>\n</div></div>";
		}
	};
});