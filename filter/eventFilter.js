angular.module('ecoposApp').filter('eventFilter', function() {
	return function(input,args) {
        var output = {};
        angular.forEach(input, function(event, key){
            if(args.isCalendar && event.date){
                output[key] = event;
            }
            else if(args.isTodo && event.type === 'todo'){
                output[key] = event;
            }
        });
		return output;
	};
});