angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, syncData, system, style, shop, $timeout) {
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
        $scope.search = system.data.search;

        //shop.api.loadShops();
        shop.api.loadShops().then(function(shops){
            var i = 0;
            while(i < Object.keys(shops).length){
                if(shops[Object.keys(shops)[i]].default){
                    shop.api.setActiveShop('main', Object.keys(shops)[i]);
                    break;
                }
                i++;
            }
        });
        $scope.shops = shop.data.shops;

        //.then(function(){
        //    $scope.shops = shop.data.shops;
        //});

        // SHOP SELECTION - could be ecossentials or sunshine-organics - whatever we name the catalog/category tree in firebase
        $scope.shopName = 'pat';

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
