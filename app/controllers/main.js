angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef, $location, $anchorScroll) {
		$scope.qty = 1;
		$scope.orders = system.data.user.orders;
		$scope.goToBottom = function (){
			// set the location.hash to the id of
			// the element you wish to scroll to.
			$location.hash('bottom');

			// call $anchorScroll()
			$anchorScroll();
		};
		$scope.msgOpen = false;
		$scope.viewHeight = window.innerHeight;
		$scope.viewWidth = window.innerWidth;
		$scope.width = (window.innerWidth / 3);
		$scope.maxHeight = (window.innerHeight - 144);
		$scope.dirDim = {
			'width': $scope.width +"px",
			'max-height': $scope.maxHeight +"px",
			'panelBodyHeight': $scope.maxHeight - 74+"px",
			'panelBodyMinHeight': "100%",
			'border-radius': '0 0 3px 3px'
		};

		console.log($scope.dirDim);
		$scope.inventory = {
			'thing':'beauty',
			'of': "sexy"
		};
		$scope.view = system.data.view;
		$scope.notificationIcons=[ {icon:'globe',name:'notifications'}, {icon:'shopping-cart',name:'cart'}, {icon:'envelope',name:'messages'}, {icon:'calendar',name:'events'}];
		$scope.navigationIcons=[ {icon: 'gear',name:'Settings'}, {icon: 'magic',name:'Tools'}, {icon: 'leaf',name:'Shop'} ];
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
		$scope.addItems = function () {
			for (var i = 0; i < 10; i++) {
				$scope.items.push({name:'item ' + ($scope.items.length + 1)});

				if ($scope.items.length >= $scope.maxItems) {
					$scope.canLoad = false;
					return;
				}
			}
		};

		$scope.reset = function () {
			$scope.items = [];
			$scope.canLoad = true;
			$scope.addItems();
		};

		$scope.reset();

		$scope.iconz = {
			icon1:{
				icon:"fa fa-plus",
				fun:function(){
					console.log("New Event Toggle");
					$scope.newEvt = !$scope.newEvt;
				}
			},
			icon2:{
				icon:"fa fa-calendar",
				fun:function(){
					console.log("Calendar Toggle");
					$scope.cal = !$scope.cal;
				}
			}
		};
		$scope.iconx = {
			icon1:{
				icon:"fa fa-plus",
				fun:function(){
					console.log("x");
					$scope.newMsg = !$scope.newMsg;
				}
			}
		};




		$scope.users = system.api.getUsersFlat();

		$scope.user = system.data.user;
		$scope.employee = system.data.employee;
		$scope.manager = system.data.manager;
		//$scope.activeRole = 'anonymous';

        // SHOP SELECTION - could be ecossentials or sunshine-organics - whatever we name the catalog/category tree in firebase
        $scope.shopName = 'shop';

        // handle catalog browsing

        $scope.stateParams = system.data.params;
        $scope.inventory = system.data.catalog.products;
        $scope.shopState = system.data.catalog.browse;
        system.api.loadCatalog($scope.shopName).then(function(catalog) {
            if (system.data.catalog.browse.categoryID) {
                system.api.loadCatalogPath(catalog, system.data.catalog.browse.categoryID).then(function(category){
                    system.api.loadCategoryProducts(category);
                });
            }
        });

/**            if(system.data.catalog[$scope.shopName]){
                $scope.shopState.category = {name: $scope.shopName, children: system.data.catalog[$scope.shopName]};
            }
            $scope.shopState.product = null;

            var cCatLevel = 0;
            var cBreadCrumb = '';
            system.data.catalog.browse.path.length = 0;
            system.data.catalog.browse.path.push({name: $scope.shopName, path: '/'});
            if($scope.shopState.category.children){
                while(cCatLevel < pathParts.length && $scope.shopState.category.children[pathParts[cCatLevel]]){
                    cBreadCrumb += ((cBreadCrumb.charAt(cBreadCrumb.length-1)!=='/')?'/':'')+pathParts[cCatLevel];
                    system.data.catalog.browse.path.push({name: pathParts[cCatLevel], path: (cCatLevel < pathParts.length-1)?cBreadCrumb:''});
                    $scope.shopState.category = $scope.shopState.category.children[pathParts[cCatLevel++]];
                }
                //console.log('what is:'+$scope.shopState.category.$getIndex());
                system.api.loadCategoryProducts($scope.shopState.category);
                if(cCatLevel < pathParts.length){
                    // the child for cCatLevel doesn't exist - maybe it is a product? try to look up by name
                    var cChild = 0;
                    var cChildNames = Object.keys($scope.shopState.category.children);
                    /**
                    do{
                        if($scope.shopState.category.children[cChildNames[cChild]] && $scope.shopState.category.children[cChildNames[cChild]].name === pathParts[cCatLevel]){
                            $scope.shopState.product = $scope.shopState.category.children[cChildNames[cChild]];
                        }
                        cChild++;
                    }while(!$scope.shopState.product && cChild < cChildNames.length);
                     */
            /**
                }
            }
             */
        //});


        $scope.stateParamsSetPath = function(path, append){
            if(typeof append === 'undefined'){ append = false; }
            if(system.data.params.data){
                var newParams = angular.copy(system.data.params.data);
                if(append && newParams.path){
                    newParams.path += ((newParams.path.charAt(newParams.path.length-1) !== '/')?'/':'')+path;
                }
                else{
                    newParams.path = path;
                }
                return newParams;
            }
        };



        /**$scope.shopBrowse = function(categoryName){
            var newParams = system.data.params.data;
            newParams.path += '/'+categoryName;
            $state.go('ecoApp.nav.not.tools.settings', newParams, {reload: true});
        };
         */



		$scope.$watch('user.activeRole', function(value){
			if(value){
				// don't reload state if they just logged in - routesecurity is taking care of that
				if(!$scope.user.session.firstActiveRole){
					$state.go('ecoApp.nav.not.tools.settings');
				}
				else{
                    $scope.user.session.firstActiveRole = false;
				}
			}
		});

        $scope.$on('$simpleLogin:profile:loaded', function(event, user){
            system.api.setUser(user);
            system.api.setUserActiveRole();

            $rootScope.toggle('loginOverlay', 'off');
            $rootScope.$broadcast('ecopos:user:bound', user);

            system.api.startUserSession();
            system.api.loadUserData();
        });

        $scope.$on('$firebaseSimpleLogin:logout', function(event){
            $log.debug('simpleLogin:logout:');
            system.api.endUserSession();
            system.api.setUser(null);
        });

        $scope.$on('$firebaseSimpleLogin:error', function(event, error){
            $log.error('simpleLogin:error:'+error);
        });

	});