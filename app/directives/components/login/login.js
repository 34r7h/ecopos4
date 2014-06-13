angular.module('ecoposApp').directive('login', function(user) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/login/login.html',
		link: function(scope, element, attrs, fn) {
            scope.user = user.data;
            scope.login = user.api.login;
            scope.logout = user.api.logout;
            scope.register = user.api.register;
            scope.recoverPassword = user.api.recoverPassword;
        }
	};
});
