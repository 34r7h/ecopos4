angular.module('ecoposApp').directive('events', function(system) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/components/events/events.html',
		link: function(scope, element, attrs, fn) {
            scope.newEvent = {
                title: '',
                description: '',
                users: [],
                shiftType: {},
                type: 'todo',
                date: new Date(),
                end: new Date(),
                hasEnd: false,
                dueDate: false
            };

            scope.createEvent = function(){
                var users = {};
                angular.forEach(scope.newEvent.users, function(username, index){
                    users[username] = scope.newEvent.type;
                    if(scope.newEvent.shiftType[username]){
                        users[username] += ':'+scope.newEvent.shiftType[username];
                    }
                });

                var dateStamp = 0;
                var endStamp = 0;
                if(scope.newEvent.type === 'calendar' || scope.newEvent.type === 'shift' || (scope.newEvent.type === 'todo' && scope.newEvent.dueDate)){
                    dateStamp = scope.newEvent.date.getTime();
                    if(scope.newEvent.type === 'shift' || scope.newEvent.hasEnd){
                        endStamp = scope.newEvent.end.getTime();
                    }
                }

                system.api.createEvent(scope.newEvent.title, scope.newEvent.description, users, scope.newEvent.type, null, dateStamp, endStamp);
            };

            scope.completeTodo = system.api.completeEvent;

		}
	};
});
