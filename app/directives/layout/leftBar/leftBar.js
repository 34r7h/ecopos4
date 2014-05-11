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
			replace: true,
			template: '<div>' +
				'<button class="col-xs-4" ng-click="right=false;left=false;leftmd=false; leftsm=!leftsm" ng-model="left"></button>'+
				'<button class="col-xs-4" ng-click="right=false;rightmd=false;left=false;leftsm=false; leftmd=!leftmd" ng-model="left"></button>'+
				'<button class="col-xs-4" ng-click="right=false;rightmd=false;rightsm=false;leftmd=false;leftsm=false; left=!left" ng-model="left"></button>' +

				'</div>',
			link: function(iElem, scope, element, attrs, fn) {


			}
		};
	})
	.directive('rightSize', function(shop, system, $compile) {
		return {
			restrict: 'E',
			replace: true,
			template: '<div>' +
				'<button class="col-xs-4" ng-click="rightBig" ng-model="right"></button>' +
				'<button class="col-xs-4" ng-click="rightMed" ng-model="right"></button>'+
				'<button class="col-xs-4" ng-click="rightSm" ng-model="right"></button>'+
				'</div>',
			link: function(iElem, $scope, element, attrs, fn) {
				$scope.rightBig = function($scope){
					$scope.left=false;
					$scope.leftmd=false;
					$scope.leftsm=false;
					$scope.rightmd=false;
					$scope.rightsm=false;
					$scope.right=!$scope.right;
				};
				$scope.rightMed = function($scope){
					$scope.left=false;
					$scope.leftmd=false;
					$scope.right=false;
					$scope.rightsm=false;
					$scope.rightmd=!$scope.rightmd;
				};
				$scope.rightSm = function($scope){
					$scope.left=false;
					$scope.right=false;
					$scope.rightmd=false;
					$scope.rightsm=!$scope.rightsm
				}


			}
		};
	});
