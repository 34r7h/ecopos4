angular.module('ecoposApp').directive('messages', function(system, syncData, $timeout, $log) {
	return {
		restrict: 'EA',
		replace: true,

		templateUrl: 'app/directives/components/messages/messages.html',
		link: function(scope, element, attrs, fn) {

            scope.text = {new:''};
            scope.subject = '';

            scope.sendMessage = function(messageID, index){
	            console.log(scope.$parent.$parent.user.messages);
                if(messageID && scope.$parent.$parent.user.messages){
                    var message = null;
                    if(scope.$parent.$parent.user.messages.unseen[messageID]){
                        message = scope.$parent.$parent.user.messages.unseen[messageID];
                    }
                    else if(scope.$parent.$parent.user.messages.seen[messageID]){
                        message = scope.$parent.$parent.user.messages.seen[messageID];
                    }

                    if(message){
                        system.api.sendMessage(message, scope.$parent.$parent.user.id, scope.text[index]);
	                    scope.text[index] = null;
                    }
                }
            };

            scope.startConversation = function(){
                system.api.createConversation(scope.subject, scope.$parent.$parent.user.id, scope.sendTo, scope.text.new);
            };
		}
	};
});
