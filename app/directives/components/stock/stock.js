angular.module('ecoposApp').directive('stock', function($q, $log, $timeout, system, shop, firebaseRef, $filter) {
    return {
        restrict: 'E',
        replace: true,
        scope: '@',
        templateUrl: 'app/directives/components/stock/stock.html',
        link: function (scope, element, attrs, fn) {
            scope.shops = {
                name: 'Shops',
                children: {}
            };

            // shop catalogs and inventory
            scope.shopConfigs = {};
            scope.inventories = {};
            scope.loadingInventory = {};

            shop.data.shops.$on('loaded', function(){
                scope.shopConfigs = shop.data.shops;
                angular.forEach(scope.shopConfigs, function(cShop, shopID){
                    shop.api.loadShopCatalog(shopID).then(function(catalog){
                        scope.shops.children[shopID] = catalog;
                        if(!scope.shops.children[shopID].children){
                            scope.shops.children[shopID].children = {};
                        }
                    });
                });
            });
            shop.data.shops.$on('child_added', function(newChild){
                var shopSnap = newChild.snapshot;
                if(!scope.shops.children[shopSnap.name]){
                    shop.api.loadShopCatalog(shopSnap.name).then(function(catalog){
                        scope.shops.children[shopSnap.name] = catalog;
                        if(!scope.shops.children[shopSnap.name].children){
                            scope.shops.children[shopSnap.name].children = {};
                        }
                    });
                }
            });
            shop.data.shops.$on('child_removed', function(oldChild) {
                var shopSnap = oldChild.snapshot;
                if(scope.shops.children[shopSnap.name]){
                    delete scope.shops.children[shopSnap.name];
                }
                if(scope.inventories[shopSnap.name]){
                    delete scope.inventories[shopSnap.name];
                }
            });
            scope.loadShopInventory = function(shopID){
                scope.loadingInventory[shopID] = true;
                shop.api.loadShopInventory(shopID).then(function(inventory){
                    scope.inventories[shopID] = inventory;
                    scope.inventories[shopID].$on('child_changed', function(childSnapshot, prevChildName){
                        scope.combineInventory();
                    });
                    var invPath = scope.shopConfigs[shopID].inventory;
                    angular.forEach(scope.shopConfigs, function(cShop, cShopID){
                        if(cShop.inventory === invPath){
                            scope.inventories[cShopID] = inventory;
                        }
                    });
                    if(scope.loadingInventory[shopID]){
                        delete scope.loadingInventory[shopID];
                    }
                    scope.combineInventory();
                });
            };

            scope.combineInventory = function(){
                var invIncluded = [];
                scope.inventory = [];
                angular.forEach(scope.filters.selectedShops, function(shopActive, shopID){
                    if(shopActive && scope.inventories[shopID]){
                        var cInv = scope.shopConfigs[shopID].inventory;
                        if(invIncluded.indexOf(cInv) === -1){
                            invIncluded.push(cInv);
                            scope.inventory = scope.inventory.concat($filter('orderByPriority')(scope.inventories[shopID]));
                        }
                    }
                });
                scope.filterInventory();
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
                return (scope.shops.children?scope.shops.children.$getIndex().length:0);
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
            scope.categoryProductCount = function(category,includeSubs){
                if(angular.isUndefined(includeSubs)){includeSubs = false;}
                var result = 0;
                var catChildren = (category.children)?$filter('orderByPriority')(category.children):null;
                if(catChildren){
                    result = ($filter('isProduct')(catChildren)).length;
                    if(includeSubs){
                        var subs = $filter('isCategory')(catChildren);
                        angular.forEach(subs, function(sub, subID){
                            result += scope.categoryProductCount(sub, true);
                        });
                    }
                }
                return result;
            };
            scope.changedCategoryCount = function(){
                return (scope.changedCategories?Object.keys(scope.changedCategories).length:0);
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
            scope.changedCategories = {};
            scope.addCategoryAt = {};
            scope.copyCategoryAt = {};
            scope.editCategoryName = {};
            scope.renamingCategory = {};
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
                scope.copyCategoryAt[catPath] = {to:true,target:[],overwrite:false,ancestorTree:true};
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
                // ecodocs: this needs to be completed
                if(angular.isDefined(scope.copyCategoryAt[catPath])){
                    if(scope.copyCategoryAt[catPath].target && scope.copyCategoryAt[catPath].target.length){
                        var sourcePath = scope.copyCategoryAt[catPath].to?catPath:scope.copyCategoryAt[catPath].target;
                        var targetPath = scope.copyCategoryAt[catPath].to?scope.copyCategoryAt[catPath].target:catPath;

                        var source = scope.getCategory(sourcePath);
                        var target = scope.getCategory(targetPath);
                        if(source && target && source.children){
                            var targetCat = target;

                            if(scope.copyCategoryAt[catPath].ancestorTree){
                                var sourceAncPath = angular.isString(sourcePath)?sourcePath.split('/'):sourcePath;
                                if(sourceAncPath.length){
                                    var sourceAncTree = scope.getCategory(sourceAncPath[0]);
                                    angular.forEach(sourceAncPath, function(cAncestorID, cAncestorIdx){
                                        console.log('where is '+cAncestorIdx+'?'+sourceAncTree.name);
                                        if(cAncestorIdx > 0){ // don't mimic the shop name
                                            if(sourceAncTree.children && sourceAncTree.children[cAncestorID]){
                                                sourceAncTree = sourceAncTree.children[cAncestorID];
                                                console.log('then:'+sourceAncTree.name);
                                            }
                                            if(!targetCat.children){
                                                targetCat.children = {};
                                            }
                                            if(!targetCat.children[cAncestorID]){
                                                targetCat.children[cAncestorID] = {name: sourceAncTree.name, children: {}};
                                                console.log('add '+sourceAncTree.name+' ('+cAncestorID+') under '+targetCat.name);
                                            }

                                            targetCat = targetCat.children[cAncestorID];
                                        }

                                    });
                                }

                            }

                            if(targetCat){
                                console.log('targetCat be '+targetCat.name);
                                if(scope.copyCategoryAt[catPath].overwrite){
                                    targetCat.children = angular.copy(source.children);
                                }
                                else{
                                    if(!targetCat.children){
                                        targetCat.children = {};
                                    }
                                    angular.forEach(source.children, function(cChild, cChildId){
                                        if(!targetCat.children[cChildId]){
                                            targetCat.children[cChildId] = angular.copy(cChild);
                                        }
                                    });
                                }
                            }

                            /**console.log('copy '+source.name+' to '+target.name+' ('+(Object.keys(source.children).length)+' children) -'+(scope.copyCategoryAt[catPath].overwrite?'overwriting':'appending')+' '+(scope.copyCategoryAt[catPath].tree?'tree':'contents only'));
                            if(scope.copyCategoryAt[catPath].overwrite){
                                if(scope.copyCategoryAt[catPath].tree){
                                    target.children = {};
                                    target.children[source.$id] = {name: source.name, children: angular.copy(source.children)};
                                }
                                else{
                                    target.children = angular.copy(source.children);
                                }
                            }
                            else{
                                angular.forEach(source.children, function(cChild, cChildID){

                                });
                            }*/
                            scope.changedCategories[targetPath] = true;
                        }
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

            // ecodocs: move this to shop.api (needs work for scope.getCategory and where it is updating the products)
            function renameCategory(oldPath, newName, shopID, cCat){
                var defer = $q.defer();
                var childProms = [];
                var oldPathStr = oldPath;
                var newPathStr = newName;
                if(angular.isUndefined(cCat)){
                    cCat = scope.getCategory(oldPath);
                    if(cCat && cCat.name !== newName){
                        oldPathStr = scope.catPathToStr(oldPath);
                        oldPathStr = oldPathStr.substr(oldPathStr.indexOf('/')+1); // take off the shop name
                        newPathStr = oldPathStr.replace(cCat.name, newName);
                    }
                    else{
                        oldPathStr = ''; // cancel it if it's the first category and the name is the same
                    }
                }

                if(cCat && oldPathStr && newPathStr && cCat.children && Object.keys(cCat.children).length){
                    if(angular.isUndefined(shopID)){
                        shopID = (oldPath.indexOf('/') !== -1)?oldPath.substr(0, oldPath.indexOf('/')):oldPath;
                    }
                    var shopInv = (shopID && scope.inventories[shopID])?scope.inventories[shopID]:null;
                    if(shopInv){
                        cCat.name = newName;
                        angular.forEach(cCat.children, function(cChild, cChildID){
                            if(cChild.children){
                                childProms.push(renameCategory(oldPathStr, newPathStr, shopID, cChild));
                            }
                            else{
                                var cProduct = shopInv[cChildID]?shopInv[cChildID]:null;
                                //console.log('rename shilly product \''+cChild.name+'\'');
                                if(cProduct && cProduct.shops[shopID] && cProduct.shops[shopID].categories){
                                    var prodShopMods = {};
                                    prodShopMods[shopID] = {categories: [], removeCategories: []};
                                    angular.forEach(cProduct.shops[shopID].categories, function(cCatEntry, cCatEntryIdx){
                                        if(cCatEntry.indexOf(oldPathStr)===0){
                                            cProduct.shops[shopID].categories[cCatEntryIdx] = cCatEntry.replace(oldPathStr, newPathStr);
                                            prodShopMods[shopID].categories.push(cProduct.shops[shopID].categories[cCatEntryIdx]);
                                            prodShopMods[shopID].removeCategories.push(cCatEntry);
                                        }
                                    });
                                    if(prodShopMods[shopID].categories.length){
                                        childProms.push(shop.api.saveProduct({$id: cChildID, shops: prodShopMods}));
                                    }
                                }
                            }
                        });
                    }
                }
                $q.all(childProms).then(function(){
                    defer.resolve(true);
                });
                return defer.promise;
            }

            scope.editCategorySave = function(catPath){
                if(angular.isDefined(scope.editCategoryName[catPath])){
                    // ecodocs: build shop renaming
                    var isShop = (catPath.indexOf('/')===-1);

                    if(!isShop && scope.editCategoryName[catPath]){
                        if (!scope.renamingCategory) {
                            scope.renamingCategory = {};
                        }
                        scope.renamingCategory[catPath] = true;

                        $timeout(function(){
                            renameCategory(catPath, scope.editCategoryName[catPath]).then(function () {
                                if (angular.isDefined(scope.renamingCategory[catPath])) {
                                    delete scope.renamingCategory[catPath];
                                }
                                delete scope.editCategoryName[catPath];

                                // ecodocs: the shop.api.renameCategory should handle this
                                // ... or better yet, the shop.api.saveProduct (when removing product from categories, check if empty children)
                                scope.deleteCategory(catPath);
                                scope.deleteCategoryConfirm(catPath);
                            });
                        });
                    }
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
                        // ecodocs: going to need to update the children in this category to remove the category from their shops[*].categories
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
                    var cCat = (scope.shops.children[catPath[cCatIdx]]?scope.shops.children[catPath[cCatIdx++]]:null);
                    while(cCat != null){
                        result = cCat;
                        cCat = (cCat.children && cCat.children[catPath[cCatIdx]]?cCat.children[catPath[cCatIdx++]]:null);
                    }
                    if(cCatIdx < catPath.length){
                        result = null;
                    }
                    if(result && !result.$id){
                        result.$id = catPath[catPath.length-1];
                    }
                    if(result && result.children===true){
                        result.children = {};
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
                    var cCat = (scope.shops.children[catPath[cCatIdx]]?scope.shops.children[catPath[cCatIdx++]]:null);
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
            });
            scope.shopSelected = function(shopID){
                if(shopID && scope.filters.selectedShops[shopID] && !scope.inventories[shopID]){
                    scope.loadShopInventory(shopID);
                }
            };

            // inventory listing
            scope.sortables=[
                {name:'name','show':true, type:'text', priority:1},
                {name:'stock',show:false, type:'number', priority:5},
                {name:'price',show:false, type:'number', priority:3},
                {name:'category',show:false, type:'categories', priority:7},
                {name:'suppliers',show:false, type:'static', priority:10}
            ];
            scope.columnCount = 1;
            scope.setColumnCount = function(){
                scope.columnCount = $filter('filter')(scope.sortables, {show:true}).length;
            };
            scope.productOrder = '';
            scope.productReverse = false;

            // ecodocs: fix this up so it can work for categories
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
            scope.productFocus = function(product, focusField){
                scope.focusProduct = product.$id;
                scope.focusField = focusField;
            };
            scope.productBlur = function(product, blurField){
                if(scope.focusProduct === product.$id){
                    if(scope.changedProducts[product.$id] && scope.changedProducts[product.$id].indexOf(blurField) !== -1){
                        scope.saveProductChanges(product, blurField);
                    }
                    scope.focusProduct = '';
                }
            };
            scope.saveProductChanges = function(product, field){
                var updateFields = {$id: product.$id, shops: product.shops};
                var updateAllChanges = false;
                if(angular.isUndefined(field) && scope.changedProducts[product.$id] && scope.changedProducts[product.$id].length){
                    field = scope.changedProducts[product.$id];
                    updateAllChanges = true;
                }
                if(angular.isString(field)){
                    field = [field];
                }
                if(angular.isArray(field)){
                    angular.forEach(field, function(cField, cFieldIdx){
                        if(cField === 'categories'){
                            // that means it was a shops update, which are always updating
                        }
                        else{
                            updateFields[cField] = product[cField];
                        }
                    });

                    // do the update
                    shop.api.saveProduct(updateFields);

                    // clear out the changedProducts tracking
                    if(scope.changedProducts[product.$id]){
                        if(updateAllChanges){
                            delete scope.changedProducts[product.$id];
                        }
                        else{
                            angular.forEach(field, function(cField, cFieldIdx){
                                if(scope.changedProducts[product.$id].indexOf(cField) !== -1){
                                    scope.changedProducts[product.$id].splice(scope.changedProducts[product.$id].indexOf(cField),1);
                                }
                            });
                            if(!scope.changedProducts[product.$id].length){
                                delete scope.changedProducts[product.$id];
                            }
                        }
                    }
                }
            };

            // add to category
            scope.productAddCats = {};
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
            scope.saveProductToCategory = function(product){
                if(product && product.$id && scope.productAddCats[product.$id] && scope.productAddCats[product.$id].length){
                    var addShop = scope.productAddCats[product.$id][0];

                    if(scope.inventories[addShop]){
                        var addCat = (scope.productAddCats[product.$id].length>1)?scope.catPathToStr(scope.productAddCats[product.$id]):'';
                        if(addCat && scope.shops.children[addShop]){
                            addCat = addCat.replace(scope.shops.children[addShop].name+'/', '');
                        }

                        if(!product.shops[addShop]){
                            product.shops[addShop] = {available:'stock',categories:[]};
                        }
                        if(!product.shops[addShop].categories){
                            product.shops[addShop].categories = [];
                        }
                        if(product.shops[addShop].categories.indexOf(addCat)===-1){
                            product.shops[addShop].categories.push(addCat);
                        }

                        if(!scope.inventories[addShop][product.$id]){
                            scope.inventories[addShop][product.$id] = product;
                            scope.combineInventory();
                        }

                        //var cCat = getCategoryForPath(scope.productAddCats[product.$id]);
                        var cCat = scope.getCategory(scope.productAddCats[product.$id]);
                        if(cCat){
                            if(!cCat.children){
                                cCat.children = {};
                            }
                            if(!cCat.children[product.$id]){
                                cCat.children[product.$id] = product;
                                scope.changedCategories[scope.productAddCats[product.$id].join('/')] = true;
                            }
                        }

                        scope.productChanged(product.$id, 'categories');
                        scope.saveProductChanges(product, 'categories');
                    }
                }
            };
        }
    };
});