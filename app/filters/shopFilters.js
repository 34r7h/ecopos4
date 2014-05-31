angular.module('ecoposApp').
    filter('isCategory', function($filter) {
        return function(input) {
            return $filter('filter')(input, function(item){ return(item.name && item.children); });
        };
    }).
    filter('isProduct', function($filter) {
        return function(input) {
            return $filter('filter')(input, function(item){ return(item.name && !item.children); });
        };
    });