angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {

		$scope.users = system.api.getUsersFlat();

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