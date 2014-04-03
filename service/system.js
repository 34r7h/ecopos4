angular.module('ecoposApp').factory('system',function(syncData, $q, $rootScope, $timeout, $log, cart) {

    var data = {
        user: {id: null, profile: null, activeRole: 'anonymous', messages: {}, events: {}, calendar: {}, session: {firstActiveRole: true, calendarEvents: {}}},
        employee: {shiftType: null},
        manager: {orders: {}}
    };


	var api = {

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

        // Utility API

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

        // Events API

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

        completeEvent: function(eventID){
            if(data.user.events[eventID]){
                if(!data.user.events[eventID].completeFlag){
                    data.user.events[eventID].$update({completed: {user: data.user.id, time: new Date().getTime()}});
                }
                else{
                    data.user.events[eventID].$update({completed: null});
                }
            }
        },

        // Messages API

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
        },

        // Calendar API
        setCalendarEvent: function(event){
            if(event.$id && event.date){
                var cDate = new Date(event.date);
                var cMonth = cDate.getMonth()+1;
                var cDay = cDate.getDate();
                var cYear = cDate.getFullYear();
                if(!data.user.calendar[cYear]){
                    data.user.calendar[cYear] = {};
                }
                if(!data.user.calendar[cYear][cMonth]){
                    data.user.calendar[cYear][cMonth] = {};
                }
                if(!data.user.calendar[cYear][cMonth][cDay]){
                    data.user.calendar[cYear][cMonth][cDay] = {};
                }
                data.user.calendar[cYear][cMonth][cDay][event.$id] = event.title;

                if(data.user.session.calendarEvents[event.$id]){
                    var oldDate = data.user.session.calendarEvents[event.$id];
                    if(oldDate.year !== data.user.session.calendarEvents[event.$id].year || oldDate.month !== data.user.session.calendarEvents[event.$id].month || oldDate.day !== data.user.session.calendarEvents[event.$id].day){
                        if(data.user.calendar[oldDate.year] && data.user.calendar[oldDate.year][oldDate.month] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id]){
                            delete data.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id];
                        }
                    }
                }
                data.user.session.calendarEvents[event.$id] = {year: cYear, month: cMonth, day: cDay};
                $rootScope.$broadcast('calendar:changed');
            }
        },
        removeCalendarEvent: function(eventID){
            if(data.user.session.calendarEvents[eventID]){
                var oldDate = data.user.session.calendarEvents[eventID];
                if(data.user.calendar[oldDate.year] && data.user.calendar[oldDate.year][oldDate.month] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID]){
                    delete data.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID];
                }
                delete data.user.session.calendarEvents[eventID];
                $rootScope.$broadcast('calendar:changed');
            }
        },

        // User API

        setUser: function(userProfile){
            if(userProfile && userProfile.$id){
                data.user.id = userProfile.$id;
                data.user.profile = userProfile;
                data.user.session.firstActiveRole = true;
            }
            else{
                data.user.activeRole = 'anonymous';
                data.user.id = null;
                data.user.profile = null;
                data.user.messages = {};
                data.user.events = {};
                data.user.calendar = {};

                data.user.session.firstActiveRole = true;
                data.user.session.calendarEvents = {};

                data.employee.shiftType = null;

                data.manager.orders = {};
            }
        },

        setUserActiveRole: function(){
            data.user.activeRole = 'anonymous';
            if(data.user.profile && data.user.profile.roles){
                if(data.user.profile.roles.admin){
                    data.user.activeRole = 'admin';
                }
                else if(data.user.profile.roles.manager){
                    data.user.activeRole = 'manager';
                }
                else if(data.user.profile.roles.employee){
                    data.user.activeRole = 'employee';
                }
                else if(data.user.profile.roles.supplier){
                    data.user.activeRole = 'supplier';
                }
                else if(data.user.profile.roles.customer){
                    data.user.activeRole = 'customer';
                }
            }
        },

        startUserSession: function(){
            if(data.user.id){
                data.user.session.loginTime = new Date().getTime();
                data.user.session.bind = syncData('session/'+data.user.session.loginTime+'-'+data.user.id);
                data.user.session.bind.$set({ start: data.user.session.loginTime });
            }
        },

        endUserSession: function(){
            if(data.user.session.bind){
                data.user.session.bind.$update({end: new Date().getTime()});
            }

        },

        loadUserData: function(){
            api.loadUserEvents();
            api.loadUserMessages();
            api.loadUserOrders();

            // load role-specific data
            if(data.user && data.user.profile.roles){
                if(data.user.profile.roles.admin || data.user.profile.roles.manager){
                    api.loadManagerData();
                }
            }
        },
        loadUserEvents: function(){
            data.user.events = {};
            if(data.user.id){
                var eventBind = syncData('user/'+data.user.id+'/events').$getRef();
                eventBind.on('child_added', function(childSnapshot, prevChildName){
                    var cEvent = syncData('event/'+childSnapshot.name());
                    data.user.events[childSnapshot.name()] = cEvent;

                    cEvent.$on('loaded', function(field){
                        cEvent.completeFlag = cEvent.completed?true:false;

                        if(cEvent.date){
                            api.setCalendarEvent(cEvent);
                            if(cEvent.type === 'shift' && data.user.session.loginTime && cEvent.users && cEvent.users[data.user.id] && data.user.session.loginTime >= cEvent.date && cEvent.end && data.user.session.loginTime <= cEvent.end) {
                                data.user.session.activeShift = cEvent;

                                var userEntry = cEvent.users[data.user.id].split(':', 2);
                                data.employee.shiftType = (userEntry.length > 1)?userEntry[1]:cEvent.users[data.user.id];

                                if(data.user.session.bind){
                                    data.user.session.bind.$update({shiftType: data.employee.shiftType});
                                }
                            }
                        }
                    });

                    cEvent.$on('change', function(field){
                        if(cEvent.date){
                            api.setCalendarEvent(cEvent);
                        }
                        if(cEvent.complete){
                            $log.debug('event \''+cEvent.title+'\' completed @ '+cEvent.complete);
                        }
                    });

                });
                eventBind.on('child_removed', function(oldChildSnapshot){
                    api.removeCalendarEvent(oldChildSnapshot.name());
                    delete data.user.events[oldChildSnapshot.name()];
                });
            }
        },
        loadUserMessages: function(){
            if(data.user.id){
                data.user.messages.seen = {};
                data.user.messages.unseen = {};

                // angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
                var unseenMsgsBind = syncData('user/'+data.user.id+'/messages/unseen').$getRef();
                unseenMsgsBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.messages.unseen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                });
                unseenMsgsBind.on('child_removed', function(oldChildSnapshot){
                    // for 3-way data binding... (not working)
                    //if(typeof messageBinds[oldChildSnapshot.name()] === 'function'){
                    //    messageBinds[oldChildSnapshot.name()]();
                    //}

                    delete data.user.messages.unseen[oldChildSnapshot.name()];
                });

                // angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
                var seenMsgBind = syncData('user/'+data.user.id+'/messages/seen').$getRef();
                seenMsgBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.messages.seen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                });
                seenMsgBind.on('child_removed', function(oldChildSnapshot){
                    delete data.user.messages.seen[oldChildSnapshot.name()];
                });
            }
        },
        loadUserOrders: function(){
            data.user.orders = {};
            if(data.user.id){
                var orderBind = syncData('user/'+data.user.id+'/orders').$getRef();
                orderBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.orders[childSnapshot.name()] = syncData('order/'+childSnapshot.name());
                });
                orderBind.on('child_removed', function(oldChildSnapshot){
                    delete data.user.orders[oldChildSnapshot.name()];
                });
            }
        },

        loadManagerData: function(){
            if(data.user && data.user.profile && data.user.profile.roles && (data.user.profile.roles.admin || data.user.profile.roles.manager)) {
                var orderBind = syncData('order').$getRef();
                orderBind.on('child_added', function (childSnapshot, prevChildName) {
                    data.manager.orders[childSnapshot.name()] = childSnapshot.val();
                });
            }
        }

    };

	return {
        api: api,
        data: data
    };
});