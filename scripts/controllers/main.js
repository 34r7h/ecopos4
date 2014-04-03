angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {

		$scope.addItems = function () {
			for (var i = 0; i < 10; i++) {
				$scope.items.push({name:'item ' + ($scope.items.length + 1)});

				if ($scope.items.length >= $scope.maxItems) {
					$scope.canLoad = false;
					return;
				}
			}
		};

		$scope.reset = function () {
			$scope.items = [];
			$scope.canLoad = true;
			$scope.addItems();
		};

		$scope.reset();

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

        $scope.$on('$simpleLogin:profile:loaded', function(event, user){
            system.api.setUser(user);
            system.api.setUserActiveRole();

            $rootScope.toggle('loginOverlay', 'off');
            $rootScope.$broadcast('ecopos:user:bound', user);

            system.api.startUserSession();
            system.api.loadUserData();
        });

        $scope.$on('$firebaseSimpleLogin:logout', function(event){
            $log.debug('simpleLogin:logout:');
            system.api.endUserSession();
            system.api.setUser(null);
        });

        $scope.$on('$firebaseSimpleLogin:error', function(event, error){
            $log.error('simpleLogin:error:'+error);
        });

	});