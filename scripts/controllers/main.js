angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {

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

		$scope.newEvent = {
			title: '',
			description: '',
			users: [],
			shiftType: {},
			type: 'todo',
			date: new Date(),
			end: new Date(),
			hasEnd: false,
			dueDate: false
		};

		$scope.createEvent = function(){
			var users = {};
			/**
			 if($scope.user && $scope.user.id){
                users[$scope.user.id] = true;
            }
			 */
			angular.forEach($scope.newEvent.users, function(username, index){
				users[username] = $scope.newEvent.type;
				if($scope.newEvent.shiftType[username]){
					users[username] += ':'+$scope.newEvent.shiftType[username];
				}
			});

			var dateStamp = 0;
			var endStamp = 0;
			if($scope.newEvent.type === 'calendar' || $scope.newEvent.type === 'shift' || ($scope.newEvent.type === 'todo' && $scope.newEvent.dueDate)){
				dateStamp = $scope.newEvent.date.getTime();
				if($scope.newEvent.type === 'shift' || $scope.newEvent.hasEnd){
					endStamp = $scope.newEvent.end.getTime();
				}
			}

			// TODO: need some validation here (or in the system.createEvent as a promise)
			system.createEvent($scope.newEvent.title, $scope.newEvent.description, users, $scope.newEvent.type, dateStamp, endStamp);
		};

	});
