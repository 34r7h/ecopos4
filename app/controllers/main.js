angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, syncData, system, style, shop, $filter, $location) {
		$scope.view = system.data.view;

		//basic stylin dimensions
		$scope.dirDim = {
			'width': style.width,
			'max-height': style['max-height'],
			'panelBodyHeight': style.panelBodyHeight,
			'panelBodyMinHeight': style.panelBodyMinHeight,
			'border-radius': style['border-radius']
		};

        $scope.breadcrumb = system.data.breadcrumb;
        //$scope.search = system.data.search; // allow the search directive to scope its own value
        $scope.search = {
            value: ''
        };

        $scope.alertz = system.ui.alertz;
        $scope.overlay = system.ui.layout.overlay;
        $scope.main = system.ui.layout.main;
        $scope.rightbar = system.ui.layout.rightbar;
        $scope.leftbar = system.ui.layout.leftbar;

        $scope.event = system.ui.content.event;
        $scope.info = system.ui.content.info;
        $scope.inventory = system.ui.content.inventory;
        $scope.message = system.ui.content.message;
        $scope.notification = system.ui.content.notification;
        $scope.order = system.ui.content.order;
        $scope.product = system.ui.content.product;

        $scope.urlTest = '';
        $scope.urlReset = false;


        $scope.$location = $location;
        var handleParams = { layout: ['overlay','main','rightbar','leftbar'], content: ['event','info','inventory','message','notification','order','product'] };
        var handleComps = ['events','inventory','messages','orders'];

        $scope.$watch('$location.url()', function(newVal){
            var params = $location.search();
            var path = $location.path();

            if(path.charAt(0) === '/'){
                path = path.substr(1);
            }
            if(path.charAt(path.length-1) === '/'){
                path = path.substr(0, path.length-1);
            }

            system.data.params.data.path = path;

            var pathParts = path.split('/');
            if(pathParts.length && handleComps.indexOf(pathParts[0]) !== -1){
                params['main'] = pathParts[0];
            }
            else{
                shop.api.getCatalogBrowser('main').then(function(browser){
                    browser.setPath(system.data.params.data['path']);
                });
            }

            angular.forEach(system.ui.layout, function(val, key){
                if(!params[key]){
                    system.ui.layout[key] = '';
                    $scope[key] = '';
                }
            });
            angular.forEach(system.ui.content, function(val, key){
                if(!params[key]){
                    system.ui.content[key] = '';
                    $scope[key] = '';
                }
            });

            angular.forEach(params, function(val, key){
                if(handleParams.layout.indexOf(key) !== -1){
                    if(system.ui.layout[key] !== val){
                        system.ui.layout[key] = val;
                        $scope[key] = val;
                    }
                }
                else if(handleParams.content.indexOf(key) !== -1){
                    if(system.ui.layout[key] !== val){
                        system.ui.content[key] = val;
                        $scope[key] = val;
                    }
                }
            });
        });

        // load shops and set default for main shop browser
        shop.api.loadShops().then(function(shops){
            var aShops = $filter('orderByPriority')(shops);
            var defShops = $filter('filter')(aShops, {default:true}, true);
            if(defShops && defShops.length){
                shop.api.setActiveShop('main', defShops[0].$id).then(function(browser){
                    if(!system.data.breadcrumb){ system.data.breadcrumb = {}; $scope.breadcrumb = system.data.breadcrumb; }
                    system.data.breadcrumb.path = browser.path;
                    if(browser.shop && browser.shop.cache){
                        var products = syncData(browser.shop.cache+'/products');
                        products.$on('value', function(){
                            system.api.searchableSet('products', products);
                        });
                    }
                });
            }
        });
        $scope.shops = shop.data.shops;

        // handle catalog browsing
        $scope.stateParams = system.data.params;

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

	});
