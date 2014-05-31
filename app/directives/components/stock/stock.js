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
            shop.data.shops.$on('child_added', function(newChild){
                var shopSnap = newChild.snapshot;
                if(!scope.catalogs[shopSnap.name]){
                    shop.api.loadShopCatalog(shopSnap.name).then(function(catalog){
                        scope.catalogs[shopSnap.name] = catalog;
                    });
                }
            });
            shop.data.shops.$on('child_removed', function(oldChild) {
                var shopSnap = oldChild.snapshot;
                if(scope.catalogs[shopSnap.name]){
                    delete scope.catalogs[shopSnap.name];
                }
                if(scope.inventories[shopSnap.name]){
                    delete scope.inventories[shopSnap.name];
                }
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

            scope.shopCount = function(){
                return (scope.shops?scope.shops.$getIndex().length:0);
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
                if(angular.isDefined(scope.openShops[shopID])){
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
            scope.addShop = function(){
                if(angular.isUndefined(scope.newShop)){
                    scope.newShop = {name: ''};
                }
            };
            scope.addShopCancel = function(){
                if(angular.isDefined(scope.newShop)){
                    delete scope.newShop;
                }
            };
            scope.addShopSave = function(){
                if(angular.isDefined(scope.newShop)){
                    if(scope.newShop.name){
                        shop.api.createShop(scope.newShop.name);
                    }
                    delete scope.newShop;
                }
            };
            scope.isDefined = angular.isDefined;

            // categories
            scope.openCategories = {};
            scope.addCategoryAt = {};
            scope.copyCategoryAt = {};
            scope.editCategoryName = {};
            scope.deleteCategoryAt = {};
            scope.openCategory = function(categoryID){
                if(!scope.openCategories){
                    scope.openCategories = {};
                }
                scope.openCategories[categoryID] = true;
            };
            scope.closeCategory = function(categoryID){
                if(angular.isDefined(scope.openCategories[categoryID])){
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
            scope.cancelCategoryActions = function(belowPath){
                angular.forEach(Object.keys(scope.openCategories), function(atPath, pidx){
                    if(atPath.indexOf(belowPath)===0){
                        scope.closeCategory(atPath);
                    }
                });
                angular.forEach(Object.keys(scope.addCategoryAt), function(atPath, pidx){
                    if(atPath.indexOf(belowPath)===0){
                        scope.addCategoryCancel(atPath);
                    }
                });
                angular.forEach(Object.keys(scope.copyCategoryAt), function(atPath, pidx){
                    if(atPath.indexOf(belowPath)===0){
                        scope.copyCategoryClose(atPath);
                    }
                });
                angular.forEach(Object.keys(scope.editCategoryName), function(atPath, pidx){
                    if(atPath.indexOf(belowPath)===0){
                        scope.editCategoryCancel(atPath);
                    }
                });
                angular.forEach(Object.keys(scope.deleteCategoryAt), function(atPath, pidx){
                    if(atPath !== belowPath && atPath.indexOf(belowPath)===0){
                        scope.deleteCategoryCancel(atPath);
                    }
                });
            };
            scope.addCategory = function(toPath){
                if(angular.isUndefined(scope.addCategoryAt[toPath])){
                    if(!scope.addCategoryAt){
                        scope.addCategoryAt = {};
                    }
                    scope.addCategoryAt[toPath] = '';
                }
            };
            scope.addCategoryCancel = function(toPath){
                if(angular.isDefined(scope.addCategoryAt[toPath])){
                    delete scope.addCategoryAt[toPath];
                }
            };
            scope.addCategorySave = function(toPath){
                if(angular.isDefined(scope.addCategoryAt[toPath])){
                    if(scope.addCategoryAt[toPath]){
                        shop.api.addCategory(scope.addCategoryAt[toPath], toPath);
                    }
                    delete scope.addCategoryAt[toPath];
                }
            };
            scope.copyCategoryOpen = function(catPath) {
                if(!scope.copyCategoryAt){
                    scope.copyCategoryAt = {};
                }
                scope.copyCategoryAt[catPath] = {to:true,target:[]};
            };
            scope.copyCategoryClose = function(catPath) {
                delete scope.copyCategoryAt[catPath];
            };
            scope.copyCategoryToggle = function(catPath){
                if(!angular.isDefined(scope.copyCategoryAt[catPath])){
                    scope.copyCategoryOpen(catPath);
                }
                else{
                    scope.copyCategoryClose(catPath);
                }
            };
            scope.copyCategory = function(catPath){
                if(angular.isDefined(scope.copyCategoryAt[catPath])){
                    if(scope.copyCategoryAt[catPath].target && scope.copyCategoryAt[catPath].target.length){
                        // TODO: copy category data
                        console.log('copy '+catPath+' '+(scope.copyCategoryAt[catPath].to?'to':'from')+' '+scope.copyCategoryAt[catPath].target.join('/'));
                    }
                    delete scope.copyCategoryAt[catPath];
                }
            };
            scope.editCategory = function(catPath){
                if(angular.isUndefined(scope.editCategoryName[catPath])){
                    if(!scope.editCategoryName){
                        scope.editCategoryName = {};
                    }
                    var cCat = scope.getCategory(catPath);
                    scope.editCategoryName[catPath] = cCat?cCat.name:'';
                }
            };
            scope.editCategoryCancel = function(catPath){
                if(angular.isDefined(scope.editCategoryName[catPath])){
                    delete scope.editCategoryName[catPath];
                }
            };
            scope.editCategorySave = function(catPath){
                if(angular.isDefined(scope.editCategoryName[catPath])){
                    if(scope.editCategoryName[catPath]){
                        var isShop = (catPath.indexOf('/')===-1);
                        console.log('rename '+(isShop?'shop':'category')+' \''+scope.editCategoryName[catPath]+'\' for '+catPath);
                        if(isShop){
                            // TODO: rename shop
                        }
                        else{
                            // TODO: rename category
                        }
                    }
                    delete scope.editCategoryName[catPath];
                }
            };
            scope.deleteCategory = function(catPath){
                if(angular.isUndefined(scope.deleteCategoryAt[catPath])){
                    if(!scope.deleteCategoryAt){
                        scope.deleteCategoryAt = {};
                    }
                    scope.deleteCategoryAt[catPath] = true;
                }
            };
            scope.deleteCategoryConfirm = function(catPath){
                if(angular.isDefined(scope.deleteCategoryAt[catPath])){
                    var isShop = (catPath.indexOf('/')===-1);
                    scope.cancelCategoryActions(catPath);
                    if(angular.isDefined(scope.filters.selectedShops[catPath])){
                        delete scope.filters.selectedShops[catPath];
                    }
                    if(isShop){
                        if(angular.isDefined(scope.openShops[catPath])){
                            scope.closeShop(catPath);
                        }
                        shop.api.deleteShop(catPath);
                    }
                    else{
                        if(angular.isDefined(scope.openCategories[catPath])){
                            scope.closeCategory(catPath);
                        }
                        shop.api.deleteCategory(catPath);
                    }
                    delete scope.deleteCategoryAt[catPath];
                }
            };
            scope.deleteCategoryCancel = function(catPath){
                if(angular.isDefined(scope.deleteCategoryAt[catPath])){
                    delete scope.deleteCategoryAt[catPath];
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
            scope.getCategory = function(catPath){
                var result = null;
                if(angular.isString(catPath)){
                    catPath = catPath.split('/');
                }
                if(angular.isArray(catPath)){
                    var cCatIdx = 0;
                    var cCat = (scope.catalogs[catPath[cCatIdx]]?scope.catalogs[catPath[cCatIdx++]]:null);
                    while(cCat != null){
                        result = cCat;
                        cCat = (cCat.children && cCat.children[catPath[cCatIdx]]?cCat.children[catPath[cCatIdx++]]:null);
                    }
                }
                return result;
            };
            scope.catPathToStr = function(catPath){
                var result = catPath;
                if(angular.isString(catPath)){
                    catPath = catPath.split('/');
                }
                if(angular.isArray(catPath)){
                    result = '';
                    var cCatIdx = 0;
                    var cCat = (scope.catalogs[catPath[cCatIdx]]?scope.catalogs[catPath[cCatIdx++]]:null);
                    while(cCat != null){
                        result += (result?'/':'')+cCat.name;
                        cCat = (cCat.children && cCat.children[catPath[cCatIdx]]?cCat.children[catPath[cCatIdx++]]:null);
                    }
                }
                return result;
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
            scope.shopSelected = function(shopID){
                if(shopID && scope.filters.selectedShops[shopID] && !scope.inventories[shopID]){
                    scope.shopLoadInventory(shopID);
                }
            };


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

            // add to category
            scope.productAddCats = {};
            scope.productAddShop = {};
            scope.addProductToCategory = function(productID, catLevel){
                if(!scope.productAddCats[productID][catLevel] && angular.isDefined(scope.productAddCats[productID][catLevel])){
                    scope.productAddCats[productID] = scope.productAddCats[productID].slice(0, catLevel);
                }
                else if(scope.productAddCats[productID].length > (catLevel+1)){
                    scope.productAddCats[productID] = scope.productAddCats[productID].slice(0, catLevel+1);
                }

                var currElement = angular.element(document.getElementById('pac-'+productID+'-'+catLevel));
                var nextElement = angular.element(document.getElementById('pac-'+productID+'-'+(catLevel+1)));
                if(nextElement && currElement && nextElement.scope() && currElement.scope()){
                    var parentCat = currElement.scope().cCat;
                    if(parentCat && parentCat.children && parentCat.children[scope.productAddCats[productID][catLevel]]){
                        nextElement.scope().cCat = parentCat.children[scope.productAddCats[productID][catLevel]];
                    }
                }
            };
            scope.addProductToShop = function(productID){
                if(scope.productAddShop[productID]){
                    console.log('add '+productID+' to '+JSON.stringify(scope.productAddShop[productID]));
                    scope.productAddCats[productID] = [scope.productAddShop[productID]];
                }
                else if(angular.isDefined(scope.productAddCats[productID])){
                    delete scope.productAddCats[productID];
                }
            };







        }
    };
});