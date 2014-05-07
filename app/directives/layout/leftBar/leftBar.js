angular.module('ecoposApp').directive('leftBar', function(shop, system) {
	return {
		restrict: 'E',
		replace: false,
		transclude:true,
		templateUrl: 'app/directives/layout/leftBar/leftBar.html',
		link: function(scope, element, attrs, fn) {

            scope.shops = shop.data.shops;
            scope.activeShop = '';
            scope.activateShop = function(){
                shop.api.setActiveShop('main', scope.activeShop);
            };

            // Shop Maker stuff
            scope.shopName = '';
            scope.shopCatalogBranch = '';
            scope.shopCatalogBranchMod = false;
            scope.shopCacheBranch = '';
            scope.shopCacheBranchMod = false;
            scope.mess = '';

            scope.createShop = function(){
                shop.api.createShop(scope.shopName).then(function(success){
                    if(success){
                        scope.mess = 'shop created successfully!';
                        scope.shopName = '';
                        scope.shopCatalogBranch = '';
                        scope.shopCatalogBranchMod = false;
                        scope.shopCacheBranch = '';
                        scope.shopCacheBranchMod = false;
                    }
                }, function(error){
                    scope.mess = 'error creating shop: \''+error+'\'';
                });
            };

            scope.autoBranchName = function(){
                if(!scope.shopCatalogBranchMod){
                    scope.shopCatalogBranch = system.api.fbSafeKey(scope.shopName);
                }
                if(!scope.shopCacheBranchMod){
                    scope.shopCacheBranch = system.api.fbSafeKey(scope.shopName);
                }
            };
		}
	};
});
