angular.module('ecoposApp').factory('style',function() {
	var viewHeight = window.innerHeight;
	var viewWidth = window.innerWidth;
	var width = (window.innerWidth / 3);
	var maxHeight = (window.innerHeight - 144);
	var style = {
		'width': width + "px",
		'max-height': maxHeight + "px",
		'panelBodyHeight': maxHeight - 74 + "px",
		'panelBodyMinHeight': "100%",
		'border-radius': '0 0 3px 3px',
		'windowWidth': viewWidth,
		'windowHeight': viewHeight
	};

	return style;
});