angular.module('ecoposApp').filter('ecoFilter', function() {
    function fieldMatches(value, target, operand){
        var result = false;
        switch(operand){
            case '=':
            case '==':
            case '===':
                result = (value === target);
                break;
            case '>':
                result = (value > target);
                break;
            case '>=':
                result = (value >= target);
                break;
            case '<':
                result = (value < target);
                break;
            case '<=':
                result = (value <= target);
                break;
            case 'contains':
                if(angular.isObject(value)){
                    value = Object.keys(value);
                }
                else if(!angular.isArray(value)){
                    value = [value];
                }
                result = (angular.isArray(value) && value.indexOf(target) !== -1);
                break;
            case 'containedIn':
                if(angular.isObject(target)){
                    target = Object.keys(target);
                }
                else if(!angular.isArray(target)){
                    target = [target];
                }
                result = (angular.isArray(target) && target.indexOf(value) !== -1);
                break;
            case 'containsAny':
                if(!angular.isArray(target) && angular.isObject(target)){
                    target = Object.keys(target);
                }
                else if(!angular.isArray(target)){
                    target = [target];
                }
                if(!angular.isArray(value) && angular.isObject(value)){
                    value = Object.keys(value);
                }
                else if(!angular.isArray(value)){
                    value = [value];
                }
                angular.forEach(value, function(cValue){
                    if(target.indexOf(cValue) !== -1){
                        result = true;
                    }
                });
                break;
        }

        return result;
    }

    function extractChild(base, child){
        var result = null;
        try{
            eval("result = base"+((child.charAt(0)!=='.' && child.charAt(0)!=='[')?'.':'')+child); // jshint ignore:line
        }
        catch(error){
            result = null;
        }
        return result;
    }

    return function(input,args,matchAll) {
        /**
         * when matchAll is true, all args must be true to pass (ie. "AND")
         * when matchAll is false, any args may be true to pass (ie. "OR")
         *
         * args is of format:
         * [{
         *      field: <fieldName>,
         *      match:  ('=','>','>=','<','<=','contains','containedIn','containsAny')
         *      value: <matchValue>,
         * }]
         *
         * contains: does value contain target? (value is array)
         * containedIn: is value found in target? (target is array)
         * containsAny: does value contain any of the items in target? (target and value are arrays)
         *
         * if match is an array of operands, value must also be an array and conditions will be applied to values sequentially
         *
         * ex. to match 'startDate' between date1 and date2:
         *  args = [
         *      {   field: 'startDate',
         *          match: ['>=','<=']
         *          value: [date1,date2]
         *      }
         *  ]
         *
         */
        var output = [];

        if(!args || !angular.isArray(args) || !args.length){
            output = input;
        }
        else{
            if(angular.isUndefined(matchAll)){
                matchAll = false;
            }
            if(!angular.isArray(args)){
                args = [args];
            }

            angular.forEach(input, function(item, key){
                var itemPass = matchAll; // if matchAll, true until not passing. if !matchAll, false until passing.

                angular.forEach(args, function(checkReq, checkIdx){
                    var reqPass = false;

                    var checkField;
                    if(checkReq.field.search(/[\.\[]/) >= 0){
                        checkField = extractChild(item, checkReq.field);
                    }
                    else{
                        checkField = item[checkReq.field];
                    }

                    if(checkField){
                        if(angular.isArray(checkReq.match)){
                            if(angular.isArray(checkReq.value) && checkReq.value.length >= checkReq.match.length){
                                var allPass = true;
                                angular.forEach(checkReq.match, function(cOp, cMatchIdx){
                                    if(!fieldMatches(checkField, checkReq.value[cMatchIdx], cOp)){
                                        allPass = false;
                                    }
                                });
                                reqPass = allPass;
                            }
                            else{
                                // not enough values given for the requested match operands
                                reqPass = false;
                            }
                        }
                        else{
                            reqPass = fieldMatches(checkField, checkReq.value, checkReq.match);
                        }
                    }

                    if(matchAll && !reqPass){
                        itemPass = false;
                    }
                    else if(!matchAll && reqPass){
                        itemPass = true;
                    }
                });

                if(itemPass){
                    output.push(item);
                }
            });
        }

        return output;
    };
});