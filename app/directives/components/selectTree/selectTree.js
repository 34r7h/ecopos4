angular.module("ecoposApp").directive("selectTree", function(){
        return {
            restrict: "E",
            scope:{tree:"=source",path:"=ngModel",id:'@',size:'@',maxSize:'@'},
            templateUrl: 'app/directives/components/selectTree/selectTree.html',
            link:function(scope, elem, attrs){
                if(!scope.path){
                    scope.path = [];
                }
                scope.selectSize = function(forItem){
                    var result = scope.size?scope.size:4;
                    if(!scope.size){
                        result = (forItem && forItem.children)?(Object.keys(forItem.children).length+1):1;
                    }
                    return (scope.maxSize && result > scope.maxSize)?scope.maxSize:result;
                };
                scope.pathChanged = function(level){
                    if(!scope.path[level] && angular.isDefined(scope.path[level])){
                        scope.path = scope.path.slice(0, level);
                    }
                    else if(scope.path.length > (level+1)){
                        scope.path = scope.path.slice(0, level+1);
                    }

                    // this is the magic the updates the recursive ng-include scope
                    var currElement = angular.element(document.getElementById(scope.id+'-'+level));
                    var nextElement = angular.element(document.getElementById(scope.id+'-'+(level+1)));
                    if(nextElement && currElement && nextElement.scope() && currElement.scope()){
                        var parentBranch = currElement.scope().cItem;
                        if(parentBranch && parentBranch.children && parentBranch.children[scope.path[level]]){
                            nextElement.scope().cItem = parentBranch.children[scope.path[level]];
                        }
                    }
                };
            }
        };
    }
);