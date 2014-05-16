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
                result = ((angular.isString(value) && value.indexOf(target) !== -1) || (angular.isArray(target) && target.indexOf(value) !== -1))?true:false;
                break;
        }
        return result;
    }

    return function(input,args,matchAll) {
        // matchAll true operates as "AND", matchAll false operates as "OR"
        /**
         * args is of format:
         * [{
         *      field: <fieldName>,
         *      match:  ('=','>','>=','<','<=','contains')
         *      value: <matchValue>,
         * }]
         *
         * if match is an array, value must also be an array - match conditions will be applied to values sequentially
         * value may be an array when match === 'contains' or match is an array (or field is an array)
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

                    if(angular.isDefined(item[checkReq.field])){
                        if(angular.isArray(checkReq.match)){
                            if(angular.isArray(checkReq.value) && checkReq.value.length >= checkReq.match.length){
                                var allPass = true;
                                angular.forEach(checkReq.match, function(cOp, cMatchIdx){
                                    if(!fieldMatches(item[checkReq.field], checkReq.value[cMatchIdx], cOp)){
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
                            reqPass = fieldMatches(item[checkReq.field], checkReq.value, checkReq.match);
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