angular.module('ecoposApp').directive('comp', function($compile,$timeout) {
	return {
		restrict:"E",

		replace:true,
		scope:{element:"=",type:"=",calendar:"@calendar"},
		link:function(scope, iElem, iAttrs,element, $scope, attrs) {
			var domElement;
            scope.$watch('element', function(newVal){
                if(newVal && (!domElement || !domElement.nodeName || newVal.toLowerCase() !== domElement.nodeName.toLowerCase())){
                    domElement = document.createElement(newVal);

                    iElem.empty();
                    iElem.append(domElement);
                    $compile(domElement)(scope);
                }
                else if(!newVal && domElement){
                    domElement = null;
                    iElem.empty();
                }
            });

/**			if(scope.element && !scope.type){
				domElement = document.createElement(scope.element);
				console.log(domElement);
				iElem.append(domElement);
				$compile(domElement)(scope);

			} else if (scope.type){
				domElement = document.createElement(scope.element);
				console.log(domElement);
				iElem.append(domElement);

			}
*/
		}
	};
}).directive('ecoRef', function($location, $log){
    return {
        restrict: 'A',
        scope: {ref:'=ecoRef', reset:'=ecoRefReset'},
        link: function(scope, element, attrs){
            scope.$watch('ref', function(newVal, oldVal){
                var locObj = null;
                var handleAreas = ['leftbar', 'main', 'rightbar', 'overlay'];

                if(angular.isObject(newVal)){
                    locObj = newVal;
                }
                else if(angular.isArray(newVal) && newVal.length){
                    locObj = {};
                    angular.forEach(newVal, function(assign, idx){
                        if(assign && idx < handleAreas.length){
                            locObj[handleAreas[idx]] = assign;
                        }
                    });
                }
                else if(angular.isString(newVal)){
                    locObj = {};
                    if(newVal.charAt(0) === '\''){
                        newVal = newVal.substr(1);
                    }
                    if(newVal.charAt(newVal.length-1) === '\''){
                        newVal = newVal.substr(0, newVal.length-1);
                    }
                    var pathSplit = newVal.split('?');
                    var newPath = (pathSplit.length?pathSplit[0]:'');

                    locObj['path'] = newPath;

                    if(pathSplit.length > 1){
                        var querySplit = pathSplit[1].split('&');
                        var idParams = {};
                        angular.forEach(querySplit, function(paramSet){
                            var paramSplit = paramSet.split('=');
                            var paramName = paramSplit.length?paramSplit[0]:'';
                            var paramVal = (paramSplit.length > 1)?paramSplit[1]:true;
                            if(paramName){
                                if(handleAreas.indexOf(paramName) !== -1){
                                    var paramValSplit = paramVal.split('/');
                                    locObj[paramName] = {type: (paramValSplit.length?paramValSplit[0]:paramVal)};
                                    if(paramValSplit.length > 1){
                                        locObj[paramName].id = paramValSplit[1];
                                    }
                                }
                                else if(paramName.substr(paramName.length-2).toLowerCase() === 'id'){
                                    idParams[paramName] = (idParams[paramName]?idParams[paramName]+',':'')+paramVal;
                                }
                            }
                        });
                        angular.forEach(idParams, function(idVal, idName){
                            var idType = idName.substr(0, idName.length-2).toLowerCase()+'s';
                            var idSplit = idVal.split(',');
                            angular.forEach(handleAreas, function(areaID, areaIdx){
                                if(locObj[areaID] && locObj[areaID].type === idType){
                                    //if(!locObj[areaID].id){
                                        locObj[areaID].id = idSplit.shift();
                                    //}
                                }
                            });

                        });
                    }
                }

                if(locObj){
                    var refPath = locObj.path?locObj.path:'';
                    var refQuery = '';
                    var idParts = {};
                    angular.forEach(handleAreas, function(areaID, areaIdx){
                        if(locObj[areaID] && locObj[areaID].type){
                            refQuery += (!refQuery?'':'&')+areaID+'='+locObj[areaID].type;
                            if(locObj[areaID].id){
                                var idType = locObj[areaID].type.substr(0, locObj[areaID].type.length-1)+'ID';
                                if(!idParts[idType]){
                                    idParts[idType] = [locObj[areaID].id];
                                }
                                else{
                                    idParts[idType].push(locObj[areaID].id);
                                }
                            }
                        }
                    });
                    angular.forEach(idParts, function(typeIDs, idType){
                        refQuery += (!refQuery?'':'&')+idType+'='+typeIDs.join(',');
                    });

                    element.attr('href', refPath+(refQuery?'?'+refQuery:''));
                    element.off('click');
                    element.on('click', function(){
                        var freshQuery = '';
                        if(!scope.reset){
                            angular.forEach($location.search(), function(sParamVal, sParamName){
                                if(!locObj[sParamName] && !idParts[sParamName]){
                                    freshQuery += (!freshQuery?'':'&')+sParamName+'='+sParamVal;
                                }
                            });
                            if(refQuery){
                                freshQuery += (freshQuery?'&':'')+refQuery;
                            }
                        }
                        else{
                            freshQuery = refQuery;
                        }

                        scope.$apply(function(){
                            $location.url(refPath+(freshQuery?'?'+freshQuery:''));
                        });
                        event.preventDefault();
                    });

                }

            });
        }
    };
}).directive('ecoPanel', function() {
	// ecoPanel is used to create component containers
	return {
		restrict: 'EA',
		replace: true,
		scope: false,
		transclude: true,
		template: function(elems, attrs) {
			var heading;
			heading = "";
			if (attrs.title || attrs.links) {
				heading = "<div class=\"panel-heading \"><span>\n  <h2 class=\"panel-title\">\n    " + attrs.title + "<span class=\"pull-right quarter-margin\" ng-repeat=\"icon in "+attrs.iconz+"\"><a href ng-click='icon.fun()'><i class=\" " + "{{icon.icon}}" + "\"></i></a></span>" + "\n</span></div>";
			}
			return "<div><div class=\"panel\">\n  " + heading + "\n  <div ng-style=\"{'max-height':dirDim.panelBodyHeight,'min-height':dirDim.panelBodyMinHeight}\" class=\"panel-body side-panels\">\n     <div class=\"\"><div ng-transclude></div></div>\n  </div>\n</div></div>";
		}
	};
});

angular.module("ecoposApp").directive("prefs", function($compile){
		return {
			restrict:"E",
			scope:{element:"=", type:"=", model:"=ngModel", placeholder:'@', name:'@'},
			link:function(scope, iElem, iAttrs) {
                var angElement = angular.element(document.createElement(scope.element));
                angElement.attr('name', scope.name);
                angElement.attr('id', scope.name);
                angElement.attr('placeholder', scope.placeholder);
                angElement.attr('ng-model', "model");
                if(scope.element === 'input'){
                    angElement.attr('type', scope.type);
                }
                $compile(angElement)(scope);
				iElem.append(angElement);
			}
		};
	}
);