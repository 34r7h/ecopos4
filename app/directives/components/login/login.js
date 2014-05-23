angular.module('ecoposApp').directive('login', function(system, simpleLogin, profileManager, $rootScope, syncData, $state, shop, $log) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/login/login.html',
		link: function(scope, element, attrs, fn) {
            scope.pass = null;
            scope.err = null;
            scope.email = null;
            scope.confirm = null;
            scope.loginMode = true;
            scope.createMode = false;
            scope.passwordMode = false;
            scope.profileMode = false;
            scope.userAuth = null;
            scope.username = null;
            scope.displayName = null;

            scope.setMode = function(mode){
                if(scope.profileMode && mode !== 'profile'){
                    scope.cancelProfile();
                }

                switch(mode){
                    case 'login':
                        scope.loginMode = true;
                        scope.createMode = false;
                        scope.passwordMode = false;
                        scope.profileMode = false;
                        break;

                    case 'password':
                        scope.loginMode = false;
                        scope.createMode = false;
                        scope.passwordMode = true;
                        scope.profileMode = false;
                        break;

                    case 'register':
                        scope.loginMode = false;
                        scope.createMode = true;
                        scope.passwordMode = false;
                        scope.profileMode = false;
                        break;

                    case 'profile':
                        scope.loginMode = false;
                        scope.createMode = false;
                        scope.passwordMode = false;
                        scope.profileMode = true;
                        break;

                    default:
                        scope.loginMode = false;
                        scope.createMode = false;
                        scope.passwordMode = false;
                        scope.profileMode = false;
                        break;
                }
            };

            scope.login = function(service) {
                simpleLogin.login(service, function(err, user) {
                    if(user){
                        profileManager.loadProfile(user.uid).then(function(success){
                        }, function(err){
                            // no profile, setup the form to create it
                            if(user.provider === 'facebook'){
                                scope.username = user.username;
                                scope.email = user.emails[0].value?user.emails[0].value:null;
                                scope.displayName = user.displayName;
                            }
                            else if(user.provider === 'twitter'){
                                scope.username = user.username;
                                scope.email = user.email; // no such luck from twitter
                                scope.displayName = user.displayName;
                            }
                            scope.setMode('profile');
                        });
                    }
                    scope.userAuth = user;
                    scope.err = err? err + '' : null;
                });
            };

            scope.loginPassword = function(cb) {
                scope.err = null;
                if( !scope.email ) {
                    scope.err = 'Please enter an email address';
                }
                else if( !scope.pass ) {
                    scope.err = 'Please enter a password';
                }
                else {
                    simpleLogin.loginPassword(scope.email, scope.pass, function(err, user) {
                        if(!err){
                            if(user){
                                // user authenticated, try to load the profile
                                profileManager.loadProfile(user.uid).then(function(success){
                                }, function(err){
                                    // no profile, setup the form to create it
                                    scope.username = user.email.split('@', 2)[0];
                                    scope.email = user.email;
                                    scope.displayName = scope.username;
                                    scope.setMode('profile');
                                });
                            }
                        }

                        scope.userAuth = user;

                        scope.err = err? err + '' : null;
                        if( !err && cb ) {
                            cb(user);
                        }
                    });
                }
            };

            scope.logout = simpleLogin.logout;

            scope.recoverPassword = function(){
                simpleLogin.forgotPassword(scope.email, function(err){
                    if(err){
                        scope.err = err? err + '' : null;
                    }
                });
            };

            scope.createAccount = function() {
                // this is for creating an email/password account
                function assertValidLoginAttempt() {
                    if( !scope.email ) {
                        scope.err = 'Please enter an email address';
                    }
                    else if( !scope.pass ) {
                        scope.err = 'Please enter a password';
                    }
                    else if( scope.pass !== scope.confirm ) {
                        scope.err = 'Passwords do not match';
                    }
                    return !scope.err;
                }

                scope.err = null;
                if( assertValidLoginAttempt() ) {
                    simpleLogin.createAccount(scope.email, scope.pass, function(err, user) {
                        if( err ) {
                            scope.err = err? err + '' : null;
                        }
                        else {
                            if(user){
                                // user authenticated, try to load the profile
                                profileManager.loadProfile(user.uid).then(function(success){
                                }, function(err){
                                    // no profile, setup the form to create it
                                    scope.username = user.email.split('@', 2)[0];
                                    scope.email = user.email;
                                    scope.displayName = scope.username;
                                    scope.setMode('profile');
                                });
                            }
                        }
                        scope.userAuth = user;
                    });
                }
            };

            scope.cancelProfile = function(){
                simpleLogin.logout();
                if(scope.userAuth.provider === 'password'){
                    simpleLogin.removeAccount(scope.email, scope.pass);
                }
                else{
                    scope.email = null;
                }
                scope.err = null;
                scope.userAuth = null;
                scope.username = null;
                scope.displayName = null;
                scope.pass = null;
                scope.profileMode = false;
                scope.setMode('login');
            };

            scope.createProfile = function(){
                // this is for creating the user profile (associates with auth account from email/password, facebook, twitter, etc)
                profileManager.createProfile(scope.userAuth.uid, scope.username, scope.email, scope.displayName).then(function(success){
                    scope.err = null;
                    scope.userAuth = null;
                    scope.username = null;
                    scope.email = null;
                    scope.pass = null;
                    scope.displayName = null;
                    scope.profileMode = false;
                    scope.setMode('login');
                }, function(err){
                    scope.err = err;
                });
            };


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
                console.log('profile loaded');
                system.api.setUser(user);
                system.api.setUserActiveRole();
                shop.api.loadOrder(user.activeOrder, true);

                var theState = $state.get('ecoApp.nav.not.tools.settings');
                theState.reloadOnSearch = true;
                $state.go('.', null, {reload:true}).then(function(){
                    theState.reloadOnSearch = false;
                });

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
