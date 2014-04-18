angular.module('ecoposApp').filter('bulkPrice', function($log) {
	return function(fromPrice,fromUnit,fromSize,toUnit,toSize) {
        if(typeof fromUnit === 'undefined'){
            fromUnit = 'lb';
        }
        if(typeof fromSize === 'undefined'){
            fromSize = 1;
        }
        if(typeof toUnit === 'undefined'){
            toUnit = 'g';
        }
        if(typeof toSize === 'undefined'){
            toSize = 100;
        }

        var conversions = {
            'g-g': 1.0,
            'lb-lb': 1.0,
            'lb-g': 453.592,
            'g-lb': 1.0/453.592
        };

        var toPrice = fromPrice;

        if(conversions[fromUnit+'-'+toUnit]){
            toPrice = (fromPrice/fromSize / conversions[fromUnit+'-'+toUnit])*toSize;
        }
        else{
            $log.error('unknown conversion \''+fromUnit+'->'+toUnit+'\'');
        }

		return toPrice;
	};
});