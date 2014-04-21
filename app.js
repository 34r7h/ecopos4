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
	'simpleLoginTools',
	'angular-gestures',
	// 'google-maps',
	'ui.bootstrap',
    'datePicker',
	'mobile-angular-ui',
	'mobile-angular-ui.touch',
	'mobile-angular-ui.scrollable',
	'ngAnimate',
	'ngMap'
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

			controller: function($scope){
				$scope.navMainTest = " navMainTest";
			},
			views:{
				admin:{
					controller:function($scope,system,$state){
						$scope.test = "Nav Admin Test";
					}
				},
				customer:{
					controller:function($scope,system,$state){
						$scope.test = "yolo customer navigation!";
					}
				},
				manager:{
					controller:function($scope,system,$state){
						$scope.test = "yolo manager navigation!";
					}
				},
				employee:{
					controller:function($scope,system,$state){
						$scope.test = "yolo employee navigation!";
					}
				},
				supplier:{
					controller:function($scope,system,$state){
						$scope.test = "yolo supplier navigation!";
					}
				},

				1:{
					controller: function($scope,system,$state){
						$scope.params = system.data.params;
						$scope.test = "1: I'm scoped from nav state!";
						$scope.reload = function() {
							$state.reload();
						};
					}				},
				2:{
				},
				shop: {
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
					controller:function($scope,system,$state){
						$scope.test = "yolo admin notifications!";
					}
				},
				customer:{
					controller:function($scope,system,$state){
						$scope.test = "yolo customer notifications!";
					}
				},
				manager:{
					controller:function($scope,system,$state){
						$scope.test = "yolo manager notifications!";
					}
				},
				employee:{
					controller:function($scope,system,$state){
						$scope.test = "yolo employee notifications!";
					}
				},
				supplier:{
					controller:function($scope,system,$state){
						$scope.test = "yolo supplier notifications!";
					}
				},
				1:{
					template:'<h3 href ng-click="$state.go(\'^\')">Notifications Yolo 1</h3><cart></cart>'
				},
				2:{
					template:'<h3 href ng-click="$state.go(\'^\')">Notifications Yolo 2</h3><messages></messages>'
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
					controller:function($scope,system,$state){
						$scope.test = "yolo admin tools!";
					}
				},
				customer:{
					controller:function($scope,system,$state){
						$scope.test = "yolo customer tools!";
					}
				},
				manager:{
					controller:function($scope,system,$state){
						$scope.test = "yolo manager tools!";
					}
				},
				employee:{
					controller:function($scope,system,$state){
						$scope.test = "yolo employee tools!";
					}
				},
				supplier:{
					controller:function($scope,system,$state){
						$scope.test = "yolo supplier tools!";
						$scope.alertz = "i know you are but what am i? i know you are but what am i? i know you are but what am i? i know you are but what am i? i know you but what am i? i know you are but what am i? i know you are but what am i? i know you are but what am i? i know you are but what am i? i know you are but what am i? ";
					}
				},
				1:{
					template: '<h4 href ng-click="$state.go(\'^\')">Tools Yolo 1</h4><calendar calendar-content="user.calendar"></calendar>'
				},
				2:{
					template: '<h4 href ng-click="$state.go(\'^\')">Tools Yolo 2</h4>'
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
			url:'*path?access_level&preferences&history',
			views: {
				admin:{
					controller:function($scope,system,$state){
						$scope.test = "yolo admin settings!";
					}
				},
				customer:{
					controller:function($scope,system,$state){
						$scope.test = "yolo customer settings!";
					}
				},
				manager:{
					controller:function($scope,system,$state){
						$scope.test = "yolo manager settings!";
					}
				},
				employee:{
					controller:function($scope,system,$state){
						$scope.test = "yolo employee settings!";
					}
				},
				supplier:{
					controller:function($scope,system,$state){
						$scope.test = "yolo supplier settings!";
					}
				},
				1:{
					controller: function($scope,$stateParams,$log,system, $state, cart, syncData){

						/*
						$scope.reload = function() {

							$state.reload();
						};
						*/
						system.data.params.data = $stateParams;
						$log.info($stateParams.params);
						console.log('%c'+system.data.params, 'background: #222; color: #bada55');
						$scope.help = system.data.params;

							$scope.test = "1: I'm scoped from settings state!";
						if ($stateParams.access_level === 'god'){
							console.log('%c Access of God', 'color:#ccc;background:#fff;');
						}
						$scope.shopName = "Ecossentials";
						$scope.products = syncData('productz');
						$scope.navigation = ['Search','Categories', 'Specials'];
						$scope.inventory = syncData('productz');

						$scope.addProduct = system.api.addProduct;
						$scope.removeItem = system.api.removeItem;
						$scope.total = system.api.total;

						$scope.cart = cart.cart;
						$scope.invoice = cart.invoice;
						$scope.items = cart.invoice.items;

                        system.data.store.browser['shop'].setCategory(system.data.params.data['path']);
					},
					template:'<h6 ng-repeat="(key,param) in help.data">{{key}}: {{param}}</h6><a href="/#/settings">Settings Yolo 1</a><p ng-repeat="(key,settings) in dashStuff2 | orderBy:key:reverse">{{ key }}: <prefs type="settings.type" element="settings.elementual"></prefs></p></div>'
				},
				2:{
					controller: function($scope,system){
						$scope.test = "2: I'm scoped from settings state!";
					},
					template:'<a ng-href="#/settings?access_level=admin&preferences=sunshine-organics&history=shop/baked-goods">Settings Yolo 2</a></div>'
				}
			},
			onEnter: function(system,$stateParams){

				system.data.params.data = $stateParams;


				if(/^\/notifications(\/.*)?$/.test($stateParams.path)){
					console.log('path does = /notifications');
					system.data.view = system.data.params.data.access_level + '@ecoApp.nav';
				} else if (/^\/tools(\/.*)?$/.test($stateParams.path)) {
					console.log('path does = /tools');
					system.data.view = system.data.params.data.access_level + '@ecoApp.nav.not';
				}  else if (/^\/settings(\/.*)?$/.test($stateParams.path)) {
					console.log('path does = /settings');
					system.data.view = system.data.params.data.access_level + '@ecoApp.nav.not.tools';
				} else if(/^\/*(\/.*)?$/.test($stateParams.path)){
					console.log('path does = /anything');
					system.data.view = system.data.params.data.access_level + '@ecoApp';
				}

				var css = "color:rgba(255,255,255,.9);text-shadow: -1px -1px hsl(0,100%,50%), 1px 1px hsl(5.4, 100%, 50%), 3px 2px hsl(10.8, 100%, 50%), 5px 3px hsl(16.2, 100%, 50%), 7px 4px hsl(21.6, 100%, 50%), 9px 5px hsl(27, 100%, 50%), 11px 6px hsl(32.4, 100%, 50%), 13px 7px hsl(37.8, 100%, 50%), 14px 8px hsl(43.2, 100%, 50%), 16px 9px hsl(48.6, 100%, 50%), 18px 10px hsl(54, 100%, 50%), 20px 11px hsl(59.4, 100%, 50%), 22px 12px hsl(64.8, 100%, 50%), 23px 13px hsl(2154.6, 100%, 50%); font-size: 20px;";


				console.log('%c settings state %s', css,'http://ecossentials.ca');

			},
			onExit: function(){
				var css = "color:rgba(255,255,255,1);text-shadow: -1px -1px hsl(0,100%,50%), 1px 1px hsl(5.4, 100%, 50%), 3px 2px hsl(10.8, 100%, 50%), 5px 3px hsl(16.2, 100%, 50%), 7px 4px hsl(21.6, 100%, 50%), 9px 5px hsl(27, 100%, 50%), 11px 6px hsl(32.4, 100%, 50%), 13px 7px hsl(37.8, 100%, 50%), 14px 8px hsl(43.2, 100%, 50%), 16px 9px hsl(48.6, 100%, 50%), 18px 10px hsl(54, 100%, 50%), 20px 11px hsl(59.4, 100%, 50%), 22px 12px hsl(64.8, 100%, 50%), 23px 13px hsl(2154.6, 100%, 50%); font-size: 16px;";
				console.log('%c goodbye settings state %s',css);
			}
		});

	// $anchorScrollProvider.disableAutoScrolling();

    $urlRouterProvider.otherwise('/');

    $stateProvider.state('test', {
        url: '/test',
	    template:'yo test!',
	    views:{
		    main:{
			    template:'<div class="app"><top-bar></top-bar><ui-view></ui-view></div><bottom-bar></bottom-bar><div overlay="loginOverlay"></div><login></login></div><h3>♥</h3>',
			    controller: 'MainCtrl'
		    },
		    sidebar1:{
			    template: '<left-bar></left-bar>'
		    },
		    sidebar2:{
			    template: '<right-bar></right-bar>'
		    }
	    }

    });



});

angular.module('ecoposApp').run(function($rootScope, simpleLogin, $state, $stateParams) {
	 $rootScope.$on('$stateChangeSuccess',
		function(event, toState, toParams, fromState, fromParams){
			if(fromParams !== toParams || toState !== fromState){
				$state.reload();

				console.log("%c $state reloaded "+toState+" greatly", "background:#aaa; color:#444");
			}
		}
	);

	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;
	       // if there is a user authenticated with firebase, this will trigger the rest of the login sequence for them
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

angular.module('ecoposApp').run(function($rootScope, $state){
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        if(toState !== fromState || toParams !== fromParams){
            $state.reload();
        }
    });
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
