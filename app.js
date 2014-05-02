angular.module('ecoposApp', [
	'ui.utils',
	'ngCookies',
	'ngResource',
	'ngSanitize',
	'ngRoute',
	'ui.router',
	'firebase',
	'angularfire.firebase',
	'angularfire.login',
	'angular-gestures',
	// 'google-maps',
	'ui.bootstrap',
    'datePicker',
	'mobile-angular-ui',
	'mobile-angular-ui.touch',
	'mobile-angular-ui.scrollable',
	'ngAnimate',
	'ngTable',
	'xeditable'
]);

angular.module('ecoposApp').config(function($stateProvider, $urlRouterProvider) {

	$stateProvider.
		state('ecoApp', {
			controller:'MainCtrl',
			templateUrl:'app/views/main.html',
			onEnter: function(){
				console.log('ecoApp State');
			},
			onExit: function(){
				console.log('goodbye ecoApp state');
			}
		}).
		state('ecoApp.nav',{
			views:{
				admin:{
				},
				customer:{
				},
				manager:{
				},
				employee:{
				},
				supplier:{
				}
			},
			onEnter: function(){
				console.log('NAV State');
			},
			onExit: function(){
				console.log('goodbye Navigation state');
			}
		}).
		state('ecoApp.nav.not',{
			views:{
				admin:{
				},
				customer:{
				},
				manager:{
				},
				employee:{
				},
				supplier:{
				}
			},
			onEnter: function(){
				console.log('notifications state');
			},
			onExit: function(){
				console.log('goodbye Notifications state');
			}
		}).
		state('ecoApp.nav.not.tools',{
			views:{
				admin:{
				},
				customer:{
				},
				manager:{
				},
				employee:{
				},
				supplier:{
				}
			},
			onEnter: function(){
				console.log('tools state');
			},
			onExit: function(){
				console.log('goodbye tools state');
			}
		}).
		state('ecoApp.nav.not.tools.settings',{
			url:'*path?role&preferences&history&store&overlay&main&settings&tools',
			resolve: {
				resolution: function($stateParams,$log,system,shop){
					system.data.params.data = $stateParams;



                    shop.api.addCatalogBrowser('shop', 'shop').then(function(browser){
                        //$scope.shop = browser;
                        browser.setPath(system.data.params.data['path']);
                    });


					if(/^\/*(\/.*)?$/.test($stateParams.path)) {
						system.data.view = system.data.user.activeRole + '@ecoApp.nav.not.tools';
						}
					return {
						view:system.data.view,
						params:system.data.params.data
					};
				}
				/*

				*/
			},
			views: {
				admin:{
					controller:function($scope,system,$state,resolution,syncData){
						$scope.resolution = resolution;
						$scope.system = system;
						$scope.breadcrumb = system.data.breadcrumb;


						system.ui.main = resolution.params.main;
						system.ui.overlay = resolution.params.overlay;
						system.ui.settings = resolution.params.settings;
						system.ui.tools = resolution.params.tools;
						console.log(system);

						$scope.iconz = {
							icon:"fa fa-plus",
							fun: function(){
								console.log("New Event Toggle");
								$scope.newEvt = !$scope.newEvt;
							}
						};

						$scope.iconx = {
							icon:"fa fa-plus",
							fun:function(){
								console.log("x");
								$scope.newMsg = !$scope.newMsg;
							}
						};
						$scope.alertz = system.ui.alertz;
						$scope.overlay = system.ui.overlay;
						$scope.main = system.ui.main;
						$scope.tools = system.ui.tools;
						$scope.settings = system.ui.settings;

						console.log($scope.overlay);
						$scope.orders = system.data.user.orders;
						var notifyRef = '/ui/admin/notifications';
						$scope.notify = syncData(notifyRef);
						console.log($scope.notify);
						var navifyRef = '/ui/admin/navigation';
						$scope.navify = syncData(navifyRef);
						console.log($scope.navify);
						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
						$scope.manager = system.data.manager;
						$scope.supplier = system.data.supplier;
						$scope.admin = system.data.admin;
						$scope.users = system.api.getUsersFlat();
					}
				},
				customer:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.notifications = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.users = system.api.getUsersFlat('manager');
					}
				},
				manager:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.notifications = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
						$scope.manager = system.data.manager;
						$scope.users = system.api.getUsersFlat();
					}
				},
				employee:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.notifications = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
						$scope.users = system.api.getUsersFlat('manager','employee');
					}
				},
				supplier:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.notifications = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.supplier = system.data.supplier;
						$scope.users = system.api.getUsersFlat('manager');
					}
				}
			},
			onEnter: function(system,$stateParams){
				console.log('%c Settings State', 'color:#888;background:#333;','http://ecossentials.ca');
				// SHOP SELECTION - could be ecossentials or sunshine-organics - whatever we name the catalog/category tree in firebase


			},
			onExit: function(){
			}
		});
	// $anchorScrollProvider.disableAutoScrolling();

    $urlRouterProvider.otherwise('/');

});

angular.module('ecoposApp').run(function($rootScope, simpleLogin, $state, $stateParams,editableOptions) {
	       // if there is a user authenticated with firebase, this will trigger the rest of the login sequence for them
	editableOptions.theme = 'bs3';
	simpleLogin.activateCurrent();
    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
});

// Declare app level module which depends on filters, and services
angular.module('ecoposApp')
	// version of this seed app is compatible with angularFire 0.6
	// see tags for other versions: https://github.com/firebase/angularFire-seed/tags
	.constant('angularFireVersion', '0.7')
	// where to redirect users if they need to authenticate (see module.routeSecurity)
	//.constant('loginRedirectPath', '/login')
    .constant('loginRedirectState', 'main.login')
	// which login service we're using
	.constant('loginProviders', 'facebook,twitter,password')
	// your Firebase URL goes here
	.constant('FBURL', 'https://opentest.firebaseio.com');
