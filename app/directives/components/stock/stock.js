angular.module('ecoposApp').directive('stock', function($q, $log, $timeout, system, shop, firebaseRef, $filter) {
    return {
        restrict: 'E',
        replace: true,
        scope: '@',
        templateUrl: 'app/directives/components/stock/stock.html',
        link: function (scope, element, attrs, fn) {

            // shop catalogs and inventory
            scope.catalogs = {};
            scope.inventories = {};
            scope.loadingInventory = {};

            shop.data.shops.$on('loaded', function(){
                scope.shops = shop.data.shops;
                angular.forEach(scope.shops, function(cShop, shopID){
                    shop.api.loadShopCatalog(shopID).then(function(catalog){
                        scope.catalogs[shopID] = catalog;
                    });
                });
            });
            scope.shopLoadInventory = function(shopID){
                scope.loadingInventory[shopID] = true;
                shop.api.loadShopInventory(shopID).then(function(inventory){
                    scope.inventories[shopID] = inventory;
                    if(scope.loadingInventory[shopID]){
                        delete scope.loadingInventory[shopID];
                    }
                    scope.combineInventory();
                    scope.filterInventory();
                });
            };

            scope.combineInventory = function(){
                var invIncluded = [];
                scope.inventory = [];
                angular.forEach(scope.filters.selectedShops, function(shopActive, shopID){
                    if(shopActive && scope.inventories[shopID] && scope.inventories[shopID].length){
                        var cInv = scope.shops[shopID].inventory;
                        if(invIncluded.indexOf(cInv) === -1){
                            invIncluded.push(cInv);
                            scope.inventory = scope.inventory.concat(scope.inventories[shopID]);
                        }
                    }
                });
            };
            scope.filterInventory = function(){
                scope.inventoryFiltered = $filter('ecoFilter')(scope.inventory, filterArgs(), scope.filters.matchAll);
                if(scope.inventoryFiltered){
                    while(scope.inventoryFiltered.length < scope.showOffset){
                        scope.prevPage();
                    }
                }
            };

            scope.shopProductCount = function(shopID){
                return ((shopID && scope.inventories[shopID])?Object.keys(scope.inventories[shopID]).length:0);
            };
            scope.totalProductCount = function(){
                return (scope.inventory?Object.keys(scope.inventory).length:0);
            };
            scope.filteredProductCount = function(){
                return (scope.inventoryFiltered?Object.keys(scope.inventoryFiltered).length:0);
            };


            // shop displays
            scope.openShops = {};
            scope.openShop = function(shopID){
                if(!scope.openShops){
                    scope.openShops = {};
                }
                scope.openShops[shopID] = true;
            };
            scope.closeShop = function(shopID){
                if(scope.openShops && scope.openShops[shopID]){
                    delete scope.openShops[shopID];
                }
            };
            scope.toggleShop = function(shopID){
                if(!scope.openShops[shopID]){
                    scope.openShop(shopID);
                }
                else{
                    scope.closeShop(shopID);
                }
            };

            // categories
            scope.openCategories = {};
            scope.openCategory = function(categoryID){
                if(!scope.openCategories){
                    scope.openCategories = {};
                }
                scope.openCategories[categoryID] = true;
            };
            scope.closeCategory = function(categoryID){
                if(scope.openCategories && scope.openCategories[categoryID]){
                    delete scope.openCategories[categoryID];
                }
            };
            scope.toggleCategory = function(categoryID){
                if(!scope.openCategories[categoryID]){
                    scope.openCategory(categoryID);
                }
                else{
                    scope.closeCategory(categoryID);
                }
            };
            scope.hasChildCategories = function(category){
                var result = false;
                if(category && category.children){
                    angular.forEach(category.children, function(cSub, cSubName){
                        if(cSub && cSub.children){
                            result = true;
                        }
                    });
                }
                return result;
            };
            scope.selectedCatToggle = function(catID){
                if(angular.isDefined(scope.filters.selectedCats[catID]) && !scope.filters.selectedCats[catID]){
                    delete scope.filters.selectedCats[catID];
                }
            };
            scope.selectedCategoriesCount = function(){
                return (scope.filters.selectedCats?Object.keys(scope.filters.selectedCats).length:0);
            };

            // inventory filtering
            scope.showFilters = true;
            scope.filters = {
                matchAll: true,
                changedProducts: false,
                name: '',
                nameExact: false,
                upc: '',
                upcExact: true,
                priceLow: 0,
                priceHigh: 0,
                stockLow: 1,
                stockHigh: 0,
                selectedCats: {},
                selectedShops: {}
            };
            function filterArgs(){
                var args = [];

                if(scope.filters.selectedCats){
                    var selectCats = [];
                    angular.forEach(scope.filters.selectedCats, function(selected, catName){
                        if(selected){
                            selectCats.push(catName);
                        }
                    });
                    if(selectCats.length){
                    /**    args.push({
                            field: 'shops[\''+scope.invShop+'\'].categories',
                            match: 'containsAny',
                            value: selectCats
                        });
                     */
                    }
                }

                if(scope.filters.changedProducts){
                    args.push({
                        field: '$id',
                        match: 'contains',
                        value: Object.keys(scope.changedProducts)
                    });
                }
                if(scope.filters.name){
                    args.push({
                        field: 'name',
                        match: scope.filters.nameExact?'==':'contains',
                        value: scope.filters.name
                    });
                }
                if(scope.filters.upc){
                    args.push({
                        field: 'upc',
                        match: scope.filters.upcExact?'=':'contains',
                        value: scope.filters.upc
                    });
                }
                if(scope.filters.priceLow && scope.filters.priceHigh && scope.filters.priceHigh >= scope.filters.priceLow){
                    args.push({
                        field: 'price',
                        match: ['>=', '<='],
                        value: [scope.filters.priceLow, scope.filters.priceHigh]
                    });
                }
                else if(scope.filters.priceHigh){
                    args.push({
                        field: 'price',
                        match: '<=',
                        value: scope.filters.priceHigh
                    });
                }
                else if(scope.filters.priceLow){
                    args.push({
                        field: 'price',
                        match: '>=',
                        value: scope.filters.priceLow
                    });
                }

                if(scope.filters.stockLow && scope.filters.stockHigh && scope.filters.stockHigh >= scope.filters.stockLow){
                    args.push({
                        field: 'stock',
                        match: ['>=', '<='],
                        value: [scope.filters.stockLow, scope.filters.stockHigh]
                    });
                }
                else if(scope.filters.stockLow){
                    args.push({
                        field: 'stock',
                        match: '>=',
                        value: scope.filters.stockLow
                    });
                }
                else if(scope.filters.stockHigh){
                    args.push({
                        field: 'stock',
                        match: '<=',
                        value: scope.filters.stockHigh
                    });
                }
                return args;
            }

            // if we watch our own filter collections, it is more efficient than the ng-repeat watching them
            scope.$watchCollection('filters', function(){
                scope.filterInventory();
            });
            scope.$watchCollection('filters.selectedCats', function(){
                scope.filterInventory();
            });
            scope.$watchCollection('filters.selectedShops', function(){
                scope.combineInventory();
                scope.filterInventory();
            });


            // inventory listing
            scope.sortables=[
                {name:'name','show':true, type:'text', priority:1},
                {name:'stock',show:false, type:'number', priority:5},
                {name:'price',show:false, type:'number', priority:3},
                {name:'category',show:false, type:'select', priority:7},
                {name:'suppliers',show:false, type:'select', priority:10}
            ];
            scope.columnCount = 1;
            scope.setColumnCount = function(){
                scope.columnCount = $filter('filter')(scope.sortables, {show:true}).length;
            };
            scope.productOrder = '';
            scope.productReverse = false;

            // TODO: fix this up so it can work for categories
            scope.sortBy = function(key){
                if(key === 'category'){
                    //key = 'shops[\''+scope.invShop+'\'].categories[0]';
                }
                if(scope.productOrder === key){
                    scope.productReverse = !scope.productReverse;
                }
                else{
                    scope.productOrder = key;
                    scope.productReverse = false;
                }
            };

            scope.showCount = 50;
            scope.showOffset = 0;
            scope.nextPage = function(){
                var maxOff = (Object.keys(scope.inventoryFiltered).length - scope.showCount);
                if(scope.showOffset <= maxOff){
                    scope.showOffset += scope.showCount;
                }
                return (scope.showOffset <= maxOff);
            };
            scope.prevPage = function(){
                if(scope.showOffset >= 1){
                    scope.showOffset -= scope.showCount;
                }
                return (scope.showOffset >= 1);
            };


            // product editing
            scope.batch = {
                stock: 0,
                sale: 0
            };
            scope.productBatch = {};
            scope.productBatchToggle = function(productID){
                if(!scope.productBatch[productID] && angular.isDefined(scope.productBatch[productID])){
                    delete scope.productBatch[productID];
                }
            };
            scope.productBatchCount = function(){
                return (scope.productBatch?Object.keys(scope.productBatch).length:0);
            };

            scope.openProducts = {};
            scope.openProduct = function(productID){
                if(!scope.openProducts){
                    scope.openProducts = {};
                }
                scope.openProducts[productID] = true;
            };
            scope.closeProduct = function(productID){
                if(scope.openProducts && scope.openProducts[productID]){
                    delete scope.openProducts[productID];
                }
            };
            scope.toggleProduct = function(productID){
                if(!scope.openProducts[productID]){
                    scope.openProduct(productID);
                }
                else{
                    scope.closeProduct(productID);
                }
            };

            scope.changedProducts = {};
            scope.focusProduct = '';
            scope.focusField = '';
            scope.changedProductCount = function(){
                return (scope.changedProducts?Object.keys(scope.changedProducts).length:0);
            };
            scope.productChanged = function(productID, changedField){
                if(!scope.changedProducts[productID]){
                    scope.changedProducts[productID] = [];
                }
                if(scope.changedProducts[productID].indexOf(changedField) === -1){
                    scope.changedProducts[productID].push(changedField);
                }
            };
            scope.productFocus = function(productID, focusField){
                scope.focusProduct = productID;
                scope.focusField = focusField;
            };
            scope.productBlur = function(productID, blurField){
                if(scope.focusProduct === productID){
                    scope.focusProduct = '';
                }
            };







        }
    };
});