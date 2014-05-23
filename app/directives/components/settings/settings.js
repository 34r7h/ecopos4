angular.module('ecoposApp').directive('settings', function(system, $timeout) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/settings/settings.html',
		link: function(scope, element, attrs, fn) {
            scope.user = system.data.user.profile;

            if(scope.user){
                scope.user.$on('loaded', function(){
                    if(!scope.user.settings){
                        scope.user.settings = {};
                        if(scope.$parent.settings){
                            scope.$parent.settings.$on('loaded', function() {
                                angular.forEach(scope.$parent.settings, function(setting, setID){
                                    if(setID.charAt(0) !== '$'){
                                        if(angular.isUndefined(scope.user.settings[setID])){
                                            scope.user.settings[setID] = {};
                                        }
                                    }
                                });
                            });
                        }
                    }
                });
            }
            scope.saveSettings = function(){
                if(scope.user){
                    scope.user.$save('settings');
                }
            };

                /**
            var user = system.data.user.profile;
            if(user && !scope.userSettings && scope.$parent.settings){
                scope.$parent.settings.$on('loaded', function(){
                    var userSettings = user.$child('settings');
                    userSettings.$on('loaded', function(){
                        userSettings.$bind(scope, 'userSettings');
                        $timeout(function(){
                            if(!scope.userSettings){
                                scope.userSettings = {};
                            }
                            angular.forEach(scope.$parent.settings, function(setting, setID){
                                if(setID.charAt(0) !== '$'){
                                    if(angular.isUndefined(scope.userSettings[setID])){
                                        scope.userSettings[setID] = {};
                                    }
                                }
                            });
                        }, 250);
                    });
                });
            }
                 */

		}
	};
});
