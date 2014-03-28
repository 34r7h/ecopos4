angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {

		$scope.users = system.api.getUsersFlat();

		$scope.user = system.data.user;
		$scope.employee = system.data.employee;
		$scope.manager = system.data.manager;
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

        var unbindUser = null;

        $scope.$on('$simpleLogin:profile:loaded', function(event, user){
            user.$bind($scope, 'userBind').then(function(unbind){
                unbindUser = unbind;

                system.api.setUser(user);
                system.api.setUserActiveRole();
                $rootScope.toggle('loginOverlay', 'off');
                $rootScope.$broadcast('ecopos:user:bound', user);

                system.api.startUserSession();
                system.api.loadUserData();
            });
        });

        $scope.$on('$firebaseSimpleLogin:logout', function(event){
            $log.debug('simpleLogin:logout:');
            if(typeof unbindUser === 'function'){
                unbindUser();
                unbindUser = null;
                system.api.endUserSession();
                system.api.setUser(null);
            }
        });

        $scope.$on('$firebaseSimpleLogin:error', function(event, error){
            $log.error('simpleLogin:error:'+error);
        });

	});