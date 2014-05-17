angular.module('ecoposApp').directive('leftBar', function(shop, system) {
	return {
		restrict: 'E',
		replace: false,
		transclude:true,
		templateUrl: 'app/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {
			scope.leftBarSize = function(name){

				if(name==="leftsm"){
					scope.leftsm = !scope.leftsm;
					scope.leftmd = false;
					scope.leftlg = false;
					if(scope.rightlg){
						scope.rightlg = false
					}
				}
				if(name==="leftmd"){
					scope.leftsm = false;
					scope.leftmd = !scope.leftmd;
					scope.leftlg = false;
					if(scope.rightlg || scope.rightmd){
						scope.rightmd = false;
						scope.rightlg = false;
					}
				}
				if(name==="leftlg"){
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = !scope.leftlg;
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = false;

				}
			}
		}
	};
});