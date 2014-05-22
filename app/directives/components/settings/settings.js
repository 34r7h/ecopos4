angular.module('ecoposApp').directive('settings', function(system) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/settings/settings.html',
		link: function(scope, element, attrs, fn) {
            scope.user = system.data.user.profile;

            scope.saveSettings = function(){
                if(scope.user){
                    scope.user.$save('settings');
                }
            };

		}
	};
});
