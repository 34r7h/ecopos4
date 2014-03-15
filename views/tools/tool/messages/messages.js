angular.module('ecoposApp').directive('messages', function(system, syncData, $timeout, $log) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'views/tools/tool/messages/messages.html',
		link: function(scope, element, attrs, fn) {

            scope.text = {new:''};
            scope.subject = '';

            scope.users = system.getUsersFlat();

            //var messageBinds = {};
            scope.messages = {unseen: {}, seen: {}};

            // watch for the user to be loaded into scope
            scope.$watch('user.$id', function(username){
                if(username && scope.user){
                    // angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
                    var unseenBind = syncData('user/'+scope.user.$id+'/messages/unseen').$getRef();

                    unseenBind.on('child_added', function(childSnapshot, prevChildName){
                        //messageBinds[childSnapshot.name()] = syncData('message/'+childSnapshot.name()).$bind(scope, 'messages.unseen['+childSnapshot.name()+']');
                        scope.messages.unseen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                    });

                    unseenBind.on('child_removed', function(oldChildSnapshot){
                        //if(typeof messageBinds[oldChildSnapshot.name()] === 'function'){
                        //    messageBinds[oldChildSnapshot.name()]();
                        //}

                        delete scope.messages.unseen[oldChildSnapshot.name()];
                    });
                }
            });

            scope.sendMessage = function(messageID, index){
                if(messageID && scope.messages){
                    var message = null;
                    if(scope.messages.unseen[messageID]){
                        message = scope.messages.unseen[messageID];
                    }
                    else if(scope.messages.seen[messageID]){
                        message = scope.messages.seen[messageID];
                    }

                    if(message){
                        system.sendMessage(message, scope.user.$id, scope.text[index]);
                    }
                }
            };

            scope.startConversation = function(){
                system.createConversation(scope.subject, scope.user.$id, scope.sendTo, scope.text.new);
            };
		}
	};
});
