angular.module('ecoposApp').
    filter('isCategory', function() {
        return function(input) {
            var output = {};
            angular.forEach(input, function(item, key){
                if(item.name && item.children){
                    output[key] = item;
                }
            });
            return output;
        };
    }).
    filter('isProduct', function() {
        return function(input) {
            var output = {};
            angular.forEach(input, function(item, key){
                if(item.name && !item.children){
                    output[key] = item;
                }
            });
            return output;
        };
    });