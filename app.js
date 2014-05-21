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
	// 'ngAnimate',
	'ngTable',
	'xeditable'
]);

angular.module('ecoposApp').config(function($stateProvider, $urlRouterProvider) {


	$stateProvider.
		state('ecoApp', {
			controller:'MainCtrl',
			resolve: {
				mainResolve: function($stateParams,$log,system,shop){
					system.ui.notify= '/ui/'+system.data.user.activeRole+'/notifications';
					system.ui.navify= '/ui/'+system.data.user.activeRole+'/navigation';
					return {
						ui:system.ui
					};
				}
			},
			templateUrl:'app/views/main.html'
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
			},
			onExit: function(){
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
			},
			onExit: function(){
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
			},
			onExit: function(){
			}
		}).
		state('ecoApp.nav.not.tools.settings',{
			// Path equals shop navigation
			// Layout parameters: main, leftbar, rightbar, overlay, alert
			// Personal parameters: role, preferences, history, store
			// Content parameters: event, info, inventory, notification, order, product, message
			url:'*path?role&preferences&history&store&overlay&main&leftbar&rightbar&event&info&stock&notification&message&order&product',
            reloadOnSearch: false,
			data:{

			},
			resolve: {
				resolution: function($stateParams,$log,system,shop){

					system.data.params.data = $stateParams;
					// allows loading directly to shop state from bookmark
					shop.api.getCatalogBrowser('main').then(function(browser){
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
			},
			views: {
				admin:{
					controller:function($scope,system,$state,resolution,syncData,Firebase, $firebase, $location, $stateParams){
						$scope.settings = syncData("settings/admin");
	/*				$scope.fireRef = new Firebase('https://opentest.firebaseio.com/ui/admin/navigation/');
						$scope.fire = $firebase($scope.fireRef);
						$scope.fire.$add({icon:"mail-forward",name:"rightbar",actions:['rightsm','rightmd','rightlg']});
*/
						$scope.resolution = resolution;
						$scope.system = system;
						$scope.stateParams = $stateParams;
						$scope.location = $location;

						// Layout
						system.ui.layout.main = resolution.params.main;
						system.ui.layout.overlay = resolution.params.overlay;
						system.ui.layout.leftbar = resolution.params.leftbar;
						system.ui.layout.rightbar = resolution.params.rightbar;

						// Params Content
						system.ui.content.event = resolution.params.event;
						system.ui.content.info = resolution.params.info;
						system.ui.content.stock = resolution.params.stock;
						system.ui.content.message = resolution.params.message;
						system.ui.content.notification = resolution.params.notification;
						system.ui.content.order = resolution.params.order;
						system.ui.content.product = resolution.params.product;



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

						$scope.orders = system.data.user.orders;

						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
						$scope.manager = system.data.manager;
						$scope.supplier = system.data.supplier;
						$scope.admin = system.data.admin;
                        system.api.getUsersFlat().then(function(users){
                            $scope.users = users;
                        });
					}
				},
				customer:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
                        system.api.getUsersFlat('manager').then(function(users){
                            $scope.users = users;
                        });
					}
				},
				manager:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
						$scope.manager = system.data.manager;
                        system.api.getUsersFlat().then(function(users){
                            $scope.users = users;
                        });
					}
				},
				employee:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.employee = system.data.employee;
                        system.api.getUsersFlat(['manager', 'employee']).then(function(users){
                            $scope.users = users;
                        });
					}
				},
				supplier:{
					controller:function($scope,system,$state,resolution){
						$scope.orders = system.data.user.orders;
						$scope.settings = {};
						$scope.navigation = {};
						$scope.user = system.data.user;
						$scope.supplier = system.data.supplier;
                        system.api.getUsersFlat('manager').then(function(users){
                            $scope.users = users;
                        });
					}
				}
			},
			onEnter: function(system,$stateParams){
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
	// which login service we're using
	.constant('loginProviders', 'facebook,twitter,password')
	// your Firebase URL goes here
	.constant('FBURL', 'https://opentest.firebaseio.com')
    // root FB path for shops data
    .constant('FBSHOPSROOT', 'shops');
