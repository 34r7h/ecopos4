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
				heading = "<div class=\"panel-heading\">\n  <h2 class=\"panel-title\">\n    " + attrs.title + "<span ng-repeat=\"(key,icon) in "+attrs.iconz+"\"><a href ng-click='icon.fun()'><i class=\"pull-right " + "{{icon.icon}}" + "\"></i></a></span>" + "\n  </h2>\n</div>";
			}
			return "<div class=\"msgevt\"><div class=\"panel\">\n  " + heading + "\n  <div class=\"panel-body well\">\n     <div ng-transclude></div>\n  </div>\n</div></div>";
		}
	};
});