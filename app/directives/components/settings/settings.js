angular.module('ecoposApp').directive('settings', function(system, $timeout) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/settings/settings.html',
		link: function(scope, element, attrs, fn) {
            /**
            scope.user = system.data.user.profile;

             scope.saveSettings = function(){
                if(scope.user){
                    scope.user.$save('settings');
                }
            };
             */

            var user = system.data.user.profile;
            if(user && !scope.userSettings){
                user.$child('settings').$bind(scope, 'userSettings');
                $timeout(function(){
                    if(scope.userSettings){
                        angular.forEach(scope.$parent.settings, function(setting, setID){
                            if(setID.charAt(0) !== '$'){
                                if(angular.isUndefined(scope.userSettings[setID])){
                                    scope.userSettings[setID] = {};
                                }
                            }
                        });
                    }
                });
            }

		}
	};
});
