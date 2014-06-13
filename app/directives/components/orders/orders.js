angular.module('ecoposApp').directive('orders', function($filter, $q, ngTableParams, system, shop) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/orders/orders.html',
		link: function(scope, element, attrs) {
			scope.total = shop.api.cartTotal;
            scope.ordersFiltered = [];
            scope.orders = [];
            scope.userOrders = system.data.user.orders;
            scope.employeeOrders = system.data.employee.orders;
            scope.managerOrders = system.data.manager.orders;
            scope.combineOrders = function(){
                scope.orders = [];
                if(scope.userOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.userOrders));
                }
                if(scope.employeeOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.employeeOrders));
                }
                if(scope.managerOrders){
                    scope.orders = scope.orders.concat($filter('orderByPriority')(scope.managerOrders));
                }
                scope.filterOrders();
            };
            scope.$watchCollection('userOrders', scope.combineOrders);
            scope.$watchCollection('employeeOrders', scope.combineOrders);
            scope.$watchCollection('managerOrders', scope.combineOrders);
            scope.filterOrders = function(){
                scope.ordersFiltered = $filter('unique')(scope.orders);
                // add any additional filters:
                // scope.ordersFiltered = $filter('ecoFilter')(scope.ordersFiltered, filter args...);
            };

            scope.sortables=[
                {name:'createdTime',title:'date','show':true, type:'date', priority:1},
                {name:'name',show:false, type:'text', priority:3},
                {name:'items',show:false, type:'static', priority:5},
                {name:'total',show:false, type:'static', priority:7}
            ];
            scope.columnCount = 1;
            scope.setColumnCount = function(){
                scope.columnCount = $filter('filter')(scope.sortables, {show:true}).length;
            };
            scope.orderSort = '';
            scope.sortReverse = false;

            scope.sortBy = function(key){
                if(scope.orderSort === key){
                    scope.sortReverse = !scope.sortReverse;
                }
                else{
                    scope.orderSort = key;
                    scope.sortReverse = false;
                }
            };

            scope.showCount = 50;
            scope.showOffset = 0;
            scope.nextPage = function(){
                var maxOff = (Object.keys(scope.ordersFiltered).length - scope.showCount);
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
            // order management interface
            scope.focusOrder = '';
            scope.changedOrders = {};

            scope.orderBatch = {};
            scope.orderBatchToggle = function(orderID){
                if(!scope.orderBatch[orderID] && angular.isDefined(scope.orderBatch[orderID])){
                    delete scope.orderBatch[orderID];
                }
            };
            scope.orderBatchCount = function(){
                return (scope.orderBatch?Object.keys(scope.orderBatch).length:0);
            };

            scope.openOrders = {};
            scope.openOrder = function(orderID){
                if(!scope.openOrders){
                    scope.openOrders = {};
                }
                scope.openOrders[orderID] = true;
            };
            scope.closeOrder = function(orderID){
                if(scope.openOrders && scope.openOrders[orderID]){
                    delete scope.openOrders[orderID];
                }
            };
            scope.toggleOrder = function(orderID){
                if(!scope.openOrders[orderID]){
                    scope.openOrder(orderID);
                }
                else{
                    scope.closeOrder(orderID);
                }
            };

            scope.changedOrders = {};
            scope.focusOrder = '';
            scope.focusField = '';
            scope.changedOrdersCount = function(){
                return (scope.changedOrders?Object.keys(scope.changedOrders).length:0);
            };
            scope.orderChanged = function(orderID, changedField){
                if(!scope.changedOrders[orderID]){
                    scope.changedOrders[orderID] = [];
                }
                if(scope.changedOrders[orderID].indexOf(changedField) === -1){
                    scope.changedOrders[orderID].push(changedField);
                }
            };
            scope.orderFocus = function(orderID, focusField){
                scope.focusOrder = orderID;
                scope.focusField = focusField;
            };
            scope.orderBlur = function(orderID, blurField){
                if(scope.focusOrder === orderID){
                    scope.focusOrder = '';
                }
            };
		}
	};
});
