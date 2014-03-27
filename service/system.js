angular.module('ecoposApp').factory('system',function(syncData, $q, $timeout, $log, cart) {



	var system = {



		// Shop API

		addProduct: function(sku, qty,unitType,name,price,img) {
			if(cart.invoice.items[sku]){
				cart.invoice.items[sku].qty += qty;
			} else {
				cart.invoice.items[sku] = {
					sku: sku,
					qty: qty,
					unitType: unitType,
					name: name,
					price: price,
					img: img
				};
			}

		},
		addItem: function() {
			cart.invoice.items.push({
				qty: 1,
				unitType:'',
				name: '',
				price: 0,
				img: ''
			});
		},
		removeItem: function(sku) {
			delete cart.invoice.items[sku];
		},
		total: function() {
			var total = 0;
			angular.forEach(cart.invoice.items, function(item) {
				total += item.qty * item.price;
			});

			return total;
		},

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

        createEvent: function(title, description, users, type, date, end){
            console.log('creating event:'+title+':'+description+':'+JSON.stringify(users)+':'+JSON.stringify(type)+':'+date);

            var newEvent = {title: title,
                description: description,
                users: users,
                type: type};
            if(date){
                newEvent.date = date;
            }
            if(end){
                newEvent.end = end;
            }
            syncData('event').$add(newEvent).then(function(eventRef){
                    angular.forEach(users, function(active, username){
                        syncData('user/'+username+'/events/'+eventRef.name()).$set(active);
                    });
                });

        },

        createConversation: function(subject, fromUser, toUsers, text){
            toUsers = (toUsers instanceof Array)?toUsers:[toUsers];

            // make a new message
            var users = {};
            users[fromUser] = true;
            angular.forEach(toUsers, function(username, index){
                if(!users[username]){
                    users[username] = true;
                }
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