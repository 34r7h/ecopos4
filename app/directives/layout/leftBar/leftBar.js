angular.module('ecoposApp').directive('leftBar', function(shop, system) {
	return {
		restrict: 'E',
		replace: false,
		transclude:true,
		templateUrl: 'app/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {

		}
	};
})
	.directive('leftSize', function(shop, system, $compile) {
		return {
			restrict: 'E',
			template: '<div>' +
				'<button class="col-xs-3" ng-click="right=false;left=false;leftmd=false; leftsm=!leftsm" ng-model="leftsm"></button>'+
				'<button class="col-xs-3" ng-click="right=false;rightmd=false;left=false;leftsm=false; leftmd=!leftmd" ng-model="leftmd"></button>'+
				'<button class="col-xs-3" ng-click="right=false;rightmd=false;rightsm=false;leftmd=false;leftsm=false; left=!left" ng-model="left"></button>' +
				'</div>',
			link: function(iElem, scope, element, attrs, fn) {


			}
		};
	})
	.directive('rightSize', function(shop, system, $compile) {
		return {
			restrict: 'E',
			template: '<div>' +
				'<button class="col-xs-3" ng-click="rightmd=false;rightsm=false;leftmd=false;leftsm=false; left=false; right=!right;"></button>' +
				'<button class="col-xs-3" ng-click="right=false;rightmd=false;rightsm=false;leftmd=false;left=false; rightmd=!rightmd;"></button>'+
				'<button class="col-xs-3" ng-click="right=false;rightsm=false;leftmd=false;leftsm=false;left=false;rightsm=!rightsm;"></button>'+
				'<button class="col-xs-3" ng-click="right=false;rightmd=false;rightsm=false;leftmd=false;leftsm=false; left=false"></button>' +
				'</div>',
			link: function(iElem, scope, element, attrs, fn) {


			}
		};
	});
