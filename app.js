angular.module('ecoposApp', [
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
	'google-maps'
]);

angular.module('ecoposApp').config(function($stateProvider, $urlRouterProvider, $anchorScrollProvider) {


	$anchorScrollProvider.disableAutoScrolling();

    $urlRouterProvider.otherwise('/');

    /* Add New States Above */
	$stateProvider
		.state('main',{
			url:'/',
			resolve:{
				test:function(){
					console.log(1);



					return 1;
				}
			},
			templateUrl:'views/main.html',
			controller: 'MainCtrl',
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
			views:{
				customer: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope,syncData){
						$scope.dashName = 'Customer';
						$scope.dashSettings = ['first name', 'last name', 'street','address', 'contact', 'shopping', 'payment'];
						$scope.orders = syncData('productz');
						$scope.navigation = ['Edit', 'Cancel', 'Save'];


					}
				},
				employee: {
					templateUrl:'views/admin/dashboard/dashboard.html',
					controller:function($scope,syncData){
						$scope.dashName = "Employee";
						$scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment', 'schedule'];
						$scope.products = syncData('inventory');
						$scope.navigation = ['Search','Categories', 'Specials'];
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

					}
				},
                admin: {
                    templateUrl:'views/admin/dashboard/dashboard.html',
                    controller:function($scope,syncData){
                        $scope.dashName = "Admin";
                        $scope.dashSettings = ['name', 'address', 'contact', 'shopping', 'payment', 'schedule'];
                        $scope.products = syncData('"produceList"');
                        $scope.navigation = ['Awesome', 'Search','Categories','Suppliers'];

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
					controller:function($scope,syncData){
						$scope.shopName = "Ecossentials";
						$scope.products = syncData('productz');
						$scope.navigation = ['Search','Categories', 'Specials'];
					}
				},
				sun: {
					templateUrl:'views/shops/store/store.html',
					controller:function($scope,syncData){
						$scope.shopName = "Sunshine Organics";
						$scope.products = syncData('inventory');
						$scope.navigation = ['Search','Categories', 'Specials'];
					}
				},
				store: {
					templateUrl:'views/shops/store/store.html',
					controller:function($scope,syncData){
						$scope.shopName = "Purchase Order";
						$scope.products = syncData('"produceList"/groceryList', 20);
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
			views:{
				agenda: {
					template:'<calendar/>',
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

});

angular.module('ecoposApp').run(function($rootScope, simpleLogin) {
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


// Declare app level module which depends on filters, and services
angular.module('ecoposApp')

	// version of this seed app is compatible with angularFire 0.6
	// see tags for other versions: https://github.com/firebase/angularFire-seed/tags
	.constant('angularFireVersion', '0.7')

	// where to redirect users if they need to authenticate (see module.routeSecurity)
	.constant('loginRedirectPath', '/login')

	// which login service we're using
	.constant('loginProviders', 'facebook,twitter,password')

	// your Firebase URL goes here
	.constant('FBURL', 'https://opentest.firebaseio.com');
