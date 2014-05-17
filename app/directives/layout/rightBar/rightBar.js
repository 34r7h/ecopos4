angular.module('ecoposApp').directive('rightBar', function() {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/layout/rightBar/rightBar.html',
		link: function(scope, element, attrs, fn) {

			scope.rightBarSize = function(name){

				if(name==="rightsm"){
					scope.rightsm = !scope.rightsm;
					scope.rightmd = false;
					scope.rightlg = false;
					if(scope.leftlg){
						scope.leftlg = false
					}
				}
				if(name==="rightmd"){
					scope.rightsm = false;
					scope.rightmd = !scope.rightmd;
					scope.rightlg = false;
					if(scope.leftlg || scope.leftmd){
						scope.leftmd = false;
						scope.leftlg = false;
					}
				}
				if(name==="rightlg"){
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = !scope.rightlg;
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = false;

				}
			}


		}
	};
});
