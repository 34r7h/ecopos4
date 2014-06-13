angular.module('ecoposApp').directive('setLayout', function($rootScope) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/layout/setLayout/setLayout.html',
		link: function(scope, element, attrs, fn) {
			scope.components=[
				{name:'orders',icon:'truck',priority:3},
				{name:'shop',icon:'gift',priority:1},
				{name:'stock',icon:'barcode',priority:5},
				{name:'settings',icon:'gears',priority:10},
				{name:'cart',icon:'shopping-cart',priority:8}
			];

			scope.barSize = function(button, name){
				scope.actionCountLeft = 0;
				scope.actionCountRight = 0;
				console.log(name + " " + button + "A Count Left: " + scope.actionCountLeft+ " A Count Right: " + scope.actionCountRight);

				if(name==="leftsm"){
					scope.leftsm = !scope.leftsm;
					scope.leftmd = false;
					scope.leftlg = false;
					if(scope.rightlg){
						scope.rightlg = false;
					}
					scope.ecoOverlay=false;
				}
				if(name==="leftmd"){
					scope.leftsm = false;
					scope.leftmd = !scope.leftmd;
					scope.leftlg = false;
					if(scope.rightlg || scope.rightmd){
						scope.rightmd = false;
						scope.rightlg = false;
					}
					scope.ecoOverlay=false;
				}
				if(name==="leftlg"){
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = !scope.leftlg;
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = false;
					scope.ecoOverlay=false;

				}
				if(name==="rightsm"){
					scope.rightsm = !scope.rightsm;
					scope.rightmd = false;
					scope.rightlg = false;
					if(scope.leftlg){
						scope.leftlg = false;
					}
					scope.ecoOverlay=false;
				}
				if(name==="rightmd"){
					scope.rightsm = false;
					scope.rightmd = !scope.rightmd;
					scope.rightlg = false;
					if(scope.leftlg || scope.leftmd){
						scope.leftmd = false;
						scope.leftlg = false;
					}
					scope.ecoOverlay=false;
				}
				if(name==="rightlg"){
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = !scope.leftlg;
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = false;
					scope.ecoOverlay=false;

				}
				if(name==="main"){
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = false;
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = false;
					scope.ecoOverlay=false;
				}
				// ecodocs: REFACTOR from $rootScope
				if(name==="overlay"){
					scope.rightsm = false;
					scope.rightmd = false;
					scope.rightlg = false;
					scope.leftsm = false;
					scope.leftmd = false;
					scope.leftlg = false;
					scope.ecoOverlay=!scope.ecoOverlay;
				}
			};

		}
	};
});
