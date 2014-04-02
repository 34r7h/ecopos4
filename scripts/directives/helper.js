angular.module('ecoposApp').directive('helper', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs, fn) {


		}
	};
}).directive('ecoPanel', function() {
	return {
		restrict: 'EA',
		replace: true,
		scope: false,
		transclude: true,
		template: function(elems, attrs) {
			var heading;
			heading = "";
			if (attrs.title || attrs.links) {
				heading = "<div class=\"panel-heading \">\n  <h2 class=\"panel-title\">\n    " + attrs.title + "<span class=\"pull-right\" ng-repeat=\"(fun,icon) in "+attrs.iconz+"\"><a href ng-click='icon.fun()'><button><i class=\" " + "{{icon.icon}}" + "\"></i></button></a></span>" + "\n  </h2>\n</div>";
			}
			return "<div><div class=\"panel\">\n  " + heading + "\n  <div class=\"panel-body well scrollable side-panels\">\n     <div class=\"scrollable-content\"><div ng-transclude></div></div>\n  </div>\n</div></div>";
		}
	};
});