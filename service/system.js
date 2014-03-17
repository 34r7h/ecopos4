angular.module('ecoposApp').factory('system',function(syncData, $q, $timeout, $log) {
	var system = {

        // gets a flattened user list with no duplicates
        getUsersFlat: function(){
            var users = [];
            // TODO: angularfire bug: instead of $getRef(), we should be able to do $on('value',... bug - https://github.com/firebase/angularFire/issues/272
            syncData('role').$getRef().on('value', function(snap){
                var roleTree = snap.val();
                users.splice(0, users.length); // reset the users array in case some were removed
                angular.forEach(roleTree, function(role, rolename){
                    if(role.users){
                        angular.forEach(role.users, function(user, username){
                            if(users.indexOf(username) === -1){
                                users.push(username);
                            }
                        });
                    }
                });
            });
            return users;
        },

        createConversation: function(subject, fromUser, toUsers, text){
            toUsers = (toUsers instanceof Array)?toUsers:[toUsers];

            // make a new message
            var users = {};
            users[fromUser] = true;
            angular.forEach(toUsers, function(username, index){
                users[username] = true;
            });

            var conversation = {};
            conversation[new Date().getTime()] = {user: fromUser, text: text};

            syncData('message').$add({
                subject: subject,
                users: users,
                conversation: conversation
            }).then(function(messageRef){
                    angular.forEach(users, function(active, username){
                        syncData('user/'+username+'/messages/unseen/'+messageRef.name()).$set(active);
                    });
                });
        },

        sendMessage: function(message, fromUser, text){
            if(message !== null){
                var newID = new Date().getTime();
                message.conversation[newID] = {user: fromUser, text: text};
                message.$save();
            }
        }
    };

	return system;
});