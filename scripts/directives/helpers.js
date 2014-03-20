angular.module('ecoposApp').directive('helpers', function() {

	angular.module('ecoposApp').directive('scrollToBookmark', function() {
	return {
		link: function(scope, element, attrs) {
			var value = attrs.scrollToBookmark;
			element.click(function() {
				scope.$apply(function() {
					var selector = "[scroll-bookmark='"+ value +"']";
					var element = $(selector);
					if(element.length)
						window.scrollTo(0, element[0].offsetTop - 100);  // Don't want the top to be the exact element, -100 will go to the top for a little bit more
				});
			});
		}
	};
});