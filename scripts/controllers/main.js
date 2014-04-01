angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {
		$scope.iconz = {
			icon1:{
				icon:"fa fa-plus",
				fun:function(){
					console.log("New Event Toggle");
					$scope.newEvt = !$scope.newEvt;
				}
			},
			icon2:{
				icon:"fa fa-calendar",
				fun:function(){
					console.log("Calendar Toggle");
					$scope.cal = !$scope.cal;
				}
			}
		};
		$scope.iconx = {
			icon1:{
				icon:"fa fa-plus",
				fun:function(){
					console.log("x");
					$scope.newMsg = !$scope.newMsg;
				}
			}
		};
		$scope.users = system.getUsersFlat();

		$scope.user = {activeRole: 'anonymous', messages: {}, events: {}, calendar: {}, session: {firstActiveRole: false, calendarEvents: {}}};
		$scope.employee = {shiftType: null};
		$scope.manager = {orders: {}};
		//$scope.activeRole = 'anonymous';

		$scope.$watch('user.activeRole', function(value){
			if(value){
				// don't reload state if they just logged in - routesecurity is taking care of that
				if(!$scope.user.session.firstActiveRole){
					$state.go('main');
				}
				else{
                    $scope.user.session.firstActiveRole = false;
				}
			}
		});

	});