angular.module('ecoposApp').directive('comp', function($compile,$timeout) {
	return {
		restrict:"E",

		replace:true,
		scope:{element:"=",type:"=",calendar:"@calendar"},
		link:function(scope, iElem, iAttrs,element, $scope, attrs) {
			var domElement;
            scope.$watch('element', function(newVal){
                if(newVal && (!domElement || !domElement.nodeName || newVal.toLowerCase() !== domElement.nodeName.toLowerCase())){
                    if(domElement){
                        //angular.element(domElement).scope().$destroy();
                    }

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
	                // TODO refactor/fix these on/off click events
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

angular.module("ecoposApp").filter('startAt', function(){
    return function(input, offset) {
        return ((angular.isArray(input) && offset < input.length)?input.slice(offset):[]);
    };
});

angular.module('ecoposApp')
    .directive('scrollPages', function () {
        return {
            link: function (scope, element, attrs) {
                var offset = parseInt(attrs.threshold) || 0;
                var e = element[0];
                var nextPage = attrs.nextPage?attrs.nextPage:null;
                var prevPage = attrs.prevPage?attrs.prevPage:null;
                var lastTop = -1;

                element.bind('scroll', function () {
                    if(prevPage && e.scrollTop < lastTop && e.scrollTop <= offset){
                        if(scope.$apply(prevPage) && attrs.backScroll){
                            lastTop = -1;
                            e.scrollTop = e.scrollHeight-e.offsetHeight-offset-1;
                        }
                    }
                    if(nextPage && e.scrollTop + e.offsetHeight >= e.scrollHeight - offset) {
                        if(scope.$apply(nextPage) && attrs.backScroll){
                            e.scrollTop = offset+1;
                        }
                    }
                    lastTop = e.scrollTop;
                });
            }
        };
    }
);

angular.module('ecoposApp')
    .directive('ecoFiles', function($parse){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                element.bind('change', function(){
                    var value = null;
                    if(element[0].files && element[0].files.length){
                        if(attrs.multiple){
                            value = [];
                            angular.forEach(element[0].files, function(cFile, cFileIdx){
                                value.push(cFile);
                            });
                        }
                        else{
                            value = element[0].files[0];
                        }
                    }
                    $parse(attrs.ecoFiles).assign(scope, value);
                    scope.$apply();
                });
            }
        };
    }
);

angular.module('ecoposApp')
	.directive('datetimepicker', [
		function() {
			if (angular.version.full < '1.1.4') {
				return {
					restrict: 'EA',
					template: "<div class=\"alert alert-danger\">Angular 1.1.4 or above is required for datetimepicker to work correctly</div>"
				};
			}
			return {
				restrict: 'EA',
				require: 'ngModel',
				scope: {
					ngModel: '=',
					dayFormat: "=",
					monthFormat: "=",
					yearFormat: "=",
					dayHeaderFormat: "=",
					dayTitleFormat: "=",
					monthTitleFormat: "=",
					showWeeks: "=",
					startingDay: "=",
					yearRange: "=",
					dateFormat: "=",
					minDate: "=",
					maxDate: "=",
					dateOptions: "=",
					dateDisabled: "&",
					hourStep: "=",
					minuteStep: "=",
					showMeridian: "=",
					meredians: "=",
					mousewheel: "=",
					showMinutes: "="
				},
				template: function(elem, attrs) {
					function dashCase(name, separator) {
						return name.replace(/[A-Z]/g, function(letter, pos) {
							return (pos ? '-' : '') + letter.toLowerCase();
						});
					}

					function createAttr(innerAttr, dateTimeAttrOpt) {
						var dateTimeAttr = angular.isDefined(dateTimeAttrOpt) ? dateTimeAttrOpt : innerAttr;
						if (attrs[dateTimeAttr]) {
							return dashCase(innerAttr) + "=\"" + dateTimeAttr + "\" ";
						} else {
							return '';
						}
					}

					function createFuncAttr(innerAttr, funcArgs, dateTimeAttrOpt) {
						var dateTimeAttr = angular.isDefined(dateTimeAttrOpt) ? dateTimeAttrOpt : innerAttr;
						if (attrs[dateTimeAttr]) {
							return dashCase(innerAttr) + "=\"" + dateTimeAttr + "({" + funcArgs + "})\" ";
						} else {
							return '';
						}
					}

					function createRequiredAttr(innerAttr, dateTimeAttrOpt) {
						var dateTimeAttr = angular.isDefined(dateTimeAttrOpt) ? dateTimeAttrOpt : innerAttr;
						if (attrs[dateTimeAttr]) {
							return dashCase(innerAttr) + "=\"" + attrs[dateTimeAttr] + "\" ";
						} else {
							return dashCase(innerAttr);
						}
					}

					function createAttrConcat(previousAttrs, attr) {
						return previousAttrs + createAttr.apply(null, attr);
					}
					var tmpl = "<div class=\"datetimepicker-wrapper\">" +
						"<input type=\"text\" ng-model=\"ngModel\" " + [
						["min", "minDate"],
						["max", "maxDate"],
						["dayFormat"],
						["monthFormat"],
						["yearFormat"],
						["dayHeaderFormat"],
						["dayTitleFormat"],
						["monthTitleFormat"],
						["showWeeks"],
						["startingDay"],
						["yearRange"],
						["datepickerOptions", "dateOptions"]
					].reduce(createAttrConcat, '') +
						createFuncAttr("dateDisabled", "date: date, mode: mode") +
						createRequiredAttr("datepickerPopup", "dateFormat") +
						"/>\n" +
						"</div>\n" +
						"<div class=\"datetimepicker-wrapper\" ng-model=\"time\" ng-change=\"time_change()\" style=\"display:inline-block\">\n" +
						"<timepicker " + [
						["hourStep"],
						["minuteStep"],
						["showMeridian"],
						["meredians"],
						["mousewheel"]
					].reduce(createAttrConcat, '') +
						"></timepicker>\n" +
						"</div>";
					return tmpl;
				},
				controller: ['$scope',
					function($scope) {
						$scope.time_change = function() {

							if (angular.isDefined($scope.ngModel) && angular.isDefined($scope.time)) {
								$scope.ngModel.setHours($scope.time.getHours(), $scope.time.getMinutes());
							}
						};
					}
				],
				link: function(scope, element, $scope) {
					scope.$watch(function() {
						return scope.ngModel;
					}, function(ngModel) {
						scope.time = ngModel;
					});
					scope.$watch(function() {
						return scope.showMinutes;
					}, function(showMinutes) {
						// var tds = element.find('td').slice(1);
						// console.log(tds);

					});
				}
			};
		}
	]);
