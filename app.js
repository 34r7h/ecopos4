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
	'google-maps',

    'datePicker',
	"mobile-angular-ui",
	"mobile-angular-ui.touch",
	"mobile-angular-ui.scrollable"
]);

angular.module('ecoposApp').config(function($stateProvider, $urlRouterProvider, $anchorScrollProvider) {

	$stateProvider.
		state('ecoApp', {
			controller:'MainCtrl',
			templateUrl:'views/main.html',
			onEnter: function(){
				console.log('ecoApp State');
			},
			onExit: function(){
				console.log('goodbye ecoApp state');
			}
		}).
		state('ecoApp.nav',{

			views:{
				1:{
					controller: function($scope,system,$state){
						$scope.params = system.data.params;
						$scope.test = "1: I'm scoped from nav state!";
						$scope.reload = function() {
							$state.reload();
						};
					},
					template:'<p ng-click="reload()">{{params}}</p><h2 href ng-click="$state.go(\'^\')">Nav Yolo 1</h2>'
				},
				2:{
					template:'<h2 href ng-click="$state.go(\'^\')">Nav Yolo 2</h2><p>{{test}}</p>'
				},
				shop: {
					templateUrl: 'views/shops/store/store.html'
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
				1:{
					template: '<h4 href ng-click="$state.go(\'^\')">Tools Yolo 1</h4><calendar calendar-content="user.calendar"></calendar>'
				},
				2:{
					template: '<h4 href ng-click="$state.go(\'^\')">Tools Yolo 2</h4><maps></maps>'
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
				1:{
					controller: function($scope,$stateParams,$log,system, $state, cart, syncData){

						$scope.reload = function() {
							$state.reload();
						};
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

                        system.data.catalog.browse['categoryID'] = system.data.params.data['path'];
					},
					template:'<h6 ng-repeat="(key,param) in help.data">{{key}}: {{param}}</h6><a ng-cloak class="list-group-item" ng-show-auth="login" ng-controller="LoginController" href="#" ng-click="logout()"><i class="fa fa-unlock"></i> Log Out <i class="fa fa-chevron-right pull-right"></i></a><a ng-cloak class="list-group-item " ng-show-auth="[\'logout\',\'error\']" href="#loginOverlay" toggle="on"><i class="fa fa-lock"></i> Cloverleaf Industries <i class="fa fa-chevron-right pull-right"></i></a><a href="/#/settings">Settings Yolo 1</a><p ng-repeat="(key,settings) in dashStuff2 | orderBy:key:reverse">{{ key }}: <prefs type="settings.type" element="settings.elementual"></prefs></p></div>'
				},
				2:{
					controller: function($scope,system){
						$scope.test = "2: I'm scoped from settings state!";
					},
					template:'<a ng-href="#/settings?access_level=god&preferences=satan&something=else">Settings Yolo 2</a><p ng-click="reload()">Reload!</p><prefs></prefs></div>'
				}
			},
			onEnter: function(system,$stateParams){

				system.data.params.data = $stateParams;


				if(/^\/notifications(\/.*)?$/.test($stateParams.path)){
					console.log('path does = /notifications');
					system.data.view = '1@ecoApp.nav';
				} else if (/^\/tools(\/.*)?$/.test($stateParams.path)) {
					console.log('path does = /tools');
					system.data.view = '1@ecoApp.nav.not';
				}  else if (/^\/settings(\/.*)?$/.test($stateParams.path)) {
					console.log('path does = /settings');
					system.data.view = '1@ecoApp.nav.not.tools';
				} else if(/^\/*(\/.*)?$/.test($stateParams.path)){
					console.log('path does = /anything');
					system.data.view = 'shop@ecoApp';
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
/*
    $stateProvider.state('test', {
        url: '/test',
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

	$stateProvider
		.state('main',{

			url:'/',

			views:{
				main:{
					templateUrl:'views/main.html',
					controller:'MainCtrl'
				},
				sidebar1:{
					template: '<left-bar></left-bar>',
					controller: 'MainCtrl'
				},
				sidebarSettings:{
					template:' <p ng-repeat="(key,settings) in dashStuff2 | orderBy:key:reverse">{{ key }}: <prefs type="settings.type" element="settings.elementual"></prefs></p>',
					controller:'MainCtrl'
				},
				sidebar2:{
					template: '<right-bar></right-bar>',
					controller:'MainCtrl'
				}
			},
			onEnter: function(){
				console.log("Entering Main State");
			},
			onExit: function(){
				console.log("Leaving Main State");
			}
		})
		.state('main.login', {
			url:'login',
			authRequired:false,
			templateUrl: 'views/login.html',
			controller: 'LoginController',
			onEnter: function(){
				console.log("Entering Login State");

			},
			onExit: function(){
				console.log("Leaving Login State");
			}
		})

		.state('main.admin',{
			url:'admin',
			abstract:true,
            authRequired:true,
			templateUrl:'views/admin/admin.html',
			controller: function($scope){

			},
			onEnter: function(){
				console.log("Entering Admin State");
			},
			onExit: function(){
				console.log("Leaving Admin State");
			}

		})
		.state('main.admin.views',{
			url:'',
            authRequired:true,
			views:{
				customer: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope, syncData){
						//$scope.user = user;
						$scope.order = syncData('order');
						$scope.dashName = 'Customer';
						$scope.dashSettings = ['first name', 'last name', 'street','address', 'contact', 'shopping', 'payment'];
						console.log($scope.user.$id);
						console.log($scope.order);


						$scope.navigation = ['Edit', 'Cancel', 'Save'];

						$scope.dashStuff = {
							"first name": ['input', 'text' ],
							"last name": ['input', 'text'],
							"street number": ['input', 'number'],
							"street name": ['input', 'text'],
							"sex": ['input', 'checkbox'],
							"height": ['input', 'text']
						};

                        $scope.orders = $scope.user.orders;

					}
				},
				employee: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope,syncData){
						$scope.dashName = "Employee";
						$scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment', 'schedule'];
						$scope.products = syncData('inventory');
						$scope.navigation = ['Search','Categories', 'Specials'];

                        $scope.orders = $scope.user.orders;
					}
				},
				supplier: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope,syncData){
						$scope.dashName = "Supplier";
						$scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment'];
						$scope.products = syncData('"produceList"');
						$scope.navigation = ['Search','Categories','Suppliers'];

					}
				},
				manager: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope,syncData){
						$scope.dashName = "Manager";
						$scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment', 'schedule'];
						$scope.products = syncData('"produceList"');
						$scope.navigation = ['Search','Categories','Suppliers'];

                        $scope.orders = $scope.manager.orders;

					}
				},
                admin: {
                    templateUrl:'views/admin/dashboard/dashboard.html',
                    controller:function($scope,syncData){
                        $scope.dashName = "Admin";
                        $scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment', 'schedule'];
                        $scope.products = syncData('"produceList"');
                        $scope.navigation = ['Awesome', 'Search','Categories','Suppliers'];
		                    $scope.dashStuff2 = {
			                    "other name": {
				                    "elementual": 'input',
				                    "type": 'text' },
			                    "end name": {
				                    "elementual": 'input',
				                    "type": 'checkbox' },
			                    "streeetz name": {
				                    "elementual": 'input',
				                    "type": 'text' },
			                    "kings of consciousness game": {
				                    "elementual": 'input',
				                    "type": 'number' }
		                    };

	                    $scope.dashStuff = {
		                    "first name": ['input', 'text' ],
		                    "last name": ['input', 'text'],
		                    "street number": ['input', 'number'],
		                    "street name": ['input', 'text'],
		                    "sex": ['input', 'checkbox']
	                    };

                        $scope.orders = $scope.manager.orders;

                    }
                }
			},
			onEnter: function(){
				console.log("Entering Admin Views");
			},
			onExit: function(){
				console.log("Leaving Admin Views");
			}

		})

		.state('main.shops',{
			url:'shop',
			abstract:true,
			templateUrl:'views/shops/shops.html',

			onEnter: function(){
				console.log("Entering Shops State");
			},
			onExit: function(){
				console.log("Leaving Shops State");
			}

		})
		.state('main.shops.views',{
			url:'',
			views:{
				eco: {
					templateUrl:'views/shops/store/store.html',
					controller:function($rootScope, $scope, cart, syncData, system){
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

					}
				},
				sun: {
					templateUrl:'views/shops/store/store.html',
					controller:function($scope,syncData){
						$scope.shopName = "Sunshine Organics";
						$scope.products = syncData('inventoryz');
						$scope.navigation = ['Search','Categories', 'Specials'];
					}
				},
				store: {
					templateUrl:'views/shops/store/store.html',
					controller:function($scope,syncData){
						$scope.shopName = "Purchase Order";
						$scope.products = syncData('inventoryz', 20);
						$scope.navigation = ['Search','Categories','Suppliers'];

					}
				}
			},
			onEnter: function(){
				console.log("Entering Shop Views");
			},
			onExit: function(){
				console.log("Leaving Shop Views");
			}

		})

		.state('main.tools',{
		url:'tools',
		abstract:true,
        authRequired:true,
		templateUrl:'views/tools/tools.html',

		onEnter: function(){
			console.log("Entering Maynard State");
		},
		onExit: function(){
			console.log("Leaving Maynard State");
		}

	})
		.state('main.tools.views',{
			url:'',
            authRequired:true,
			views:{
				agenda: {
					template:'<calendar calendar-content="user.calendar" />',
					controller:function($scope,syncData){
						$scope.toolName = "Agenda";
						$scope.products = syncData('productz');
						$scope.navigation = ['Search','Categories', 'Specials'];
					}
				},
				delivery: {
					template:'<map/>',
					controller:function($scope,syncData){
						$scope.toolName = "Delivery";
						$scope.products = syncData('inventory');
						$scope.navigation = ['Search','Categories', 'Specials'];
					}
				},
				info: {
					template:'<infos/>',
					controller:function($scope,syncData){
						$scope.toolName = "Info";
						$scope.info = syncData('infoz/content');
						$scope.navigation = ['Search','Categories','Suppliers'];

					}
				},
				messages: {
					template:'<messages/>',
					controller:function($scope,syncData){
						$scope.toolName = "Info";
						$scope.user = syncData('user');
						$scope.messages = syncData('messagez');
						$scope.navigation = ['Search','Categories','Suppliers'];

					}
				}
			},
			onEnter: function(){
				console.log("Entering Maynard Views");
			},
			onExit: function(){
				console.log("Leaving Maynard Views");
			}

		});
	*/

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
