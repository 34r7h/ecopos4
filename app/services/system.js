angular.module('ecoposApp').factory('system',function(syncData, firebaseRef) {

    var data = {
        user: {id: null, profile: null, activeRole: 'anonymous', notifications: {}, messages: {}, events: {}, calendar: {}, session: {firstActiveRole: true, calendarEvents: {}}},
        employee: {shiftType: null},
        manager: {orders: {}},
        params:{},
        breadcrumb:[],
        search:'',
        view:''
    };

    var api = {
        // Utility API

        currentTime: function(){
            return new Date().getTime();
        },

        // gets a flattened user list with no duplicates
        getUsersFlat: function(fromRoles){
            if(typeof fromRoles === 'undefined'){ fromRoles = ['manager']; }
            else if(!(fromRoles instanceof Array)){ fromRoles = fromRoles.split(','); }

            var users = [];
            firebaseRef('role').on('value', function(snap){
                var roleTree = snap.val();
                users.splice(0, users.length); // reset the users array in case some were removed
                angular.forEach(roleTree, function(role, rolename){
                    if(role.users && fromRoles.indexOf(rolename) !== -1){
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
                    data.user.events[eventID].$update({completed: {user: data.user.id, time: api.currentTime()}});
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
            conversation[api.currentTime()] = {user: fromUser, text: text};

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
                var newID = api.currentTime();
                message.conversation[newID] = {user: fromUser, text: text};
                message.$save();
            }
        },

        // Notification API
        sendNotification: function(toUsers, type, content, time){
            if(typeof time === 'undefined'){
                time = api.currentTime();
            }
            toUsers = (toUsers instanceof Array)?toUsers:[toUsers];

            var users = {};
            angular.forEach(toUsers, function(username, index){
                if(!users[username]){
                    users[username] = true;
                }
            });

            var newNotification = {
                type: type,
                content: content,
                time: time,
                users: users,
                sender: data.user.id
            };

            syncData('notification').$add(newNotification).then(function(notificationRef){
                angular.forEach(users, function(active, username){
                    syncData('user/'+username+'/notifications/'+notificationRef.name()).$set(active);
                });
            });
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
                data.user.calendar[cYear][cMonth][cDay][event.$id] = event;

                if(data.user.session.calendarEvents[event.$id]){
                    var oldDate = data.user.session.calendarEvents[event.$id];
                    if(oldDate.year !== data.user.session.calendarEvents[event.$id].year || oldDate.month !== data.user.session.calendarEvents[event.$id].month || oldDate.day !== data.user.session.calendarEvents[event.$id].day){
                        if(data.user.calendar[oldDate.year] && data.user.calendar[oldDate.year][oldDate.month] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id]){
                            delete data.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id];
                        }
                    }
                }
                data.user.session.calendarEvents[event.$id] = {year: cYear, month: cMonth, day: cDay};
            }
        },
        removeCalendarEvent: function(eventID){
            if(data.user.session.calendarEvents[eventID]){
                var oldDate = data.user.session.calendarEvents[eventID];
                if(data.user.calendar[oldDate.year] && data.user.calendar[oldDate.year][oldDate.month] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day] && data.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID]){
                    delete data.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID];
                }
                delete data.user.session.calendarEvents[eventID];
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
                data.user.notifications = {};
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
                data.user.session.loginTime = api.currentTime();
                data.user.session.bind = syncData('session/'+data.user.session.loginTime+'-'+data.user.id);
                data.user.session.bind.$set({ start: data.user.session.loginTime });
            }
        },

        endUserSession: function(){
            if(data.user.session.bind){
                data.user.session.bind.$update({end: api.currentTime()});
            }

        },

        loadUserData: function(){
            api.loadUserNotifications();
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
                var eventBind = firebaseRef('user/'+data.user.id+'/events');
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

                var unseenMsgsBind = firebaseRef('user/'+data.user.id+'/messages/unseen');
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

                var seenMsgBind = firebaseRef('user/'+data.user.id+'/messages/seen');
                seenMsgBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.messages.seen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                });
                seenMsgBind.on('child_removed', function(oldChildSnapshot){
                    delete data.user.messages.seen[oldChildSnapshot.name()];
                });
            }
        },
        loadUserNotifications: function(){
            if(data.user.id) {
                data.user.notifications = {};
                if(data.user.id){
                    var notificationBind = firebaseRef('user/'+data.user.id+'/notifications');
                    notificationBind.on('child_added', function(childSnapshot, prevChildName){
                        data.user.notifications[childSnapshot.name()] = syncData('notification/'+childSnapshot.name());
                    });
                    notificationBind.on('child_removed', function(oldChildSnapshot){
                        delete data.user.notifications[oldChildSnapshot.name()];
                    });
                }
            }
        },
        loadUserOrders: function(){
            data.user.orders = {};
            if(data.user.id){
                var orderBind = firebaseRef('user/'+data.user.id+'/orders');
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
                var orderBind = firebaseRef('order');
                orderBind.on('child_added', function (childSnapshot, prevChildName) {
                    data.manager.orders[childSnapshot.name()] = childSnapshot.val();
                });
            }
        }
    };

	var ui = {
		navify:{},
		notify:{},
		overlay:false,
		main:"",
		settings:"",
		tools:"",
		alertz:""

	};
    return {
	    ui: ui,
        api: api,
        data: data
    };
});