angular.module('ecoposApp').directive('userInfo', function(system, $rootScope, $log, $state) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/userInfo/userInfo.html',
		link: function(scope, element, attrs, fn) {

			scope.$watch('user.activeRole', function(value){
				if(value){
					// don't reload state if they just logged in - routesecurity is taking care of that
					if(!scope.user.session.firstActiveRole){
						$state.go('ecoApp.nav.not.tools.settings');
					}
					else{
						scope.user.session.firstActiveRole = false;
					}
				}
			});

			scope.$on('$simpleLogin:profile:loaded', function(event, user){
				system.api.setUser(user);
				system.api.setUserActiveRole();

                $state.go('.', null, {reload:true});

				$rootScope.toggle('overlay', 'off');
				$rootScope.$broadcast('ecopos:user:bound', user);

				system.api.startUserSession();
				system.api.loadUserData();
			});

			scope.$on('$firebaseSimpleLogin:logout', function(event){
				$log.debug('simpleLogin:logout:');
				system.api.endUserSession();
				system.api.setUser(null);
			});

			scope.$on('$firebaseSimpleLogin:error', function(event, error){
				$log.error('simpleLogin:error:'+error);
			});


		}
	};
});
