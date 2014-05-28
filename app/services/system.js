angular.module('ecoposApp').factory('system',function(syncData, firebaseRef, $q, $filter, $http, Firebase, $firebase) {

    var data = {
        user: {id: null, anonID: '', profile: null, activeRole: 'anonymous', activeOrder: '', geoIP: {}, messages: {}, events: {}, orders: {}, calendar: {}, session: {anonCheckTime: 0, firstActiveRole: true, calendarEvents: {}}},
        employee: {shiftType: null},
        manager: {orders: {}},
        params:{},
        breadcrumb:[],
        search:{sets: {}},
        view:'',
	    info:''
    };

    var api = {
        // Utility API

        currentTime: function(){
            return new Date().getTime();
        },
        anonymousID: function(){
            var defer = $q.defer();
            if(!data.user.anonID){
                if(!data.user.session.anonCheckTime){
                    data.user.session.anonCheckTime = api.currentTime();
                    // TODO: we should put this in ngStorage
                }
                var freshID = 'anon-'+data.user.session.anonCheckTime;
                api.userGeoIP().then(function(geoIP){
                    if(geoIP.ip){
                        freshID += '-'+geoIP.ip.replace(/\./g, '_');
                    }
                    data.user.anonID = freshID;
                    defer.resolve(data.user.anonID);
                });
            }
            else{
                defer.resolve(data.user.anonID);
            }
            return defer.promise;
        },
        fbPathExists: function(fbPath){
            var defer = $q.defer();

            firebaseRef(fbPath).once('value', function(snap){
                defer.resolve((snap.val()!==null)?true:false);
            });

            return defer.promise;
        },
        fbSafePath: function(fbPath, maxCount, count){
            var tryPath = fbPath;
            if(typeof maxCount === 'undefined'){ maxCount = 999; }
            if(typeof count === 'undefined'){
                count = 0;
                tryPath = fbPath;
            }
            else{
                tryPath = fbPath+'-'+count;
            }
            var defer = $q.defer();
            api.fbPathExists(tryPath).then(function(exists){
                if(exists){
                    if(maxCount > 0 && count >= maxCount){
                        defer.reject('Maximum unique paths for \''+fbPath+'\' attempted and \''+tryPath+'\' exists.');
                    }
                    else{
                        defer.notify('Path \''+tryPath+'\' exists...');
                        api.fbSafePath(fbPath, maxCount, (count+1)).then(function(safePath){
                            defer.resolve(safePath);
                        }, function(error){
                            defer.reject(error);
                        }, function(notification){
                            defer.notify(notification);
                        });
                    }
                }
                else{
                    defer.resolve(tryPath);
                }
            });
            return defer.promise;
        },
        fbSafeKey: function(rawKey){
            var safeKey = rawKey.trim();
            var foulChar = [];

            //".", "#", "$", "/", "[", or "]"
            if(safeKey.indexOf('.') >= 0){
                foulChar.push('.');
            }
            if(safeKey.indexOf('#') >= 0){
                foulChar.push('#');
            }
            if(safeKey.indexOf('$') >= 0){
                foulChar.push('$');
            }
            if(safeKey.indexOf('/') >= 0){
                foulChar.push('/');
            }
            if(safeKey.indexOf('[') >= 0){
                foulChar.push('[');
            }
            if(safeKey.indexOf(']') >= 0){
                foulChar.push(']');
            }

            // firebase banned characters
            safeKey = safeKey.replace(/\./g, '');
            safeKey = safeKey.replace(/#/g, 'No_');
            safeKey = safeKey.replace(/\$/g, '');
            safeKey = safeKey.replace(/\//g, '-');
            safeKey = safeKey.replace(/\[/g, '(');
            safeKey = safeKey.replace(/\]/g, ')');

            // URL banned characters
            safeKey = safeKey.replace(/ /g, '-');
            safeKey = safeKey.replace(/\?/g, '_');
            safeKey = safeKey.replace(/[^a-zA-Z0-9-_]/g, '');
            safeKey = safeKey.replace(/--*/g, '-'); // take out multiple consecutive --

            if(!safeKey){
                safeKey = 'unknown';
            }

            safeKey = safeKey.toLowerCase();

            return safeKey;
        },

        // search api
        search: function(query, triggerID){
            if(angular.isUndefined(query)){
                query = {
                    filter: {value: ''},
                    sets: Object.keys(data.search.sets),
                    results: {}
                };
            }

            // by default, search all sets
            if(!query.sets){
                query.sets = Object.keys(data.search.sets);
            }
            else if(!angular.isArray(query.sets)){
                query.sets = [query.sets];
            }

            if(query.value && query.sets.length && !query.results){
                query.results = {};
            }
            else if(!query.value && query.results){
                query.results = null;
            }

            if(query.value && query.results){
                angular.forEach(query.sets, function(setName, setIdx){
                    var cSet = data.search.sets[setName];
                    if(cSet && cSet.data){
                        var parent = '';
                        if(cSet.config && cSet.config.parent){
                            parent = cSet.config.parent;
                        }
                        else{
                            var cSetSplit = setName.indexOf('-');
                            if(cSetSplit !== -1){
                                parent = setName.substr(0,cSetSplit);
                            }
                        }

                        if(cSet.config && angular.isFunction(cSet.config.deepSearch)){
                            query.results[setName] = $filter('filter')(cSet.data, cSet.config.deepSearch(query));
                        }
                        else if(angular.isObject(query.value)){
                            query.results[setName] = $filter('filter')(cSet.data, query.value);
                        }
                        else{
                            query.results[setName] = $filter('filter')(cSet.data, {$:query.value});
                        }
                        if(query.results[setName] && query.results[setName].length){
                            query.results[setName] = $filter('unique')(query.results[setName]);
                            if(parent){
                                if(!query.results[parent]){
                                    query.results[parent] = query.results[setName];
                                }
                                else if(angular.isArray(query.results[parent])){
                                    Array.prototype.splice.apply(query.results[parent], [query.results[parent].length, 0].concat(query.results[setName]));
                                    query.results[parent] = $filter('unique')(query.results[parent]);
                                }
                            }
                        }
                    }
                });
            }
        },
        searchableConfig: function(searchSet, searchConfig){
            /**
             if we want to configure a deepSearch for a certain set, we can do so with:
             searchConfig = {
                deepSearch: function(value){ return (true||false); }
            };
             */
            if(searchConfig){
                if(!data.search.sets[searchSet]){
                    data.search.sets[searchSet] = {};
                }
                data.search.sets[searchSet].config = searchConfig;
            }
        },
        searchableSet: function(searchSet, searchData){
            if(angular.isUndefined(searchData)){
                searchData = [];
            }
            else if(searchData){
                if(angular.isObject(searchData)){
                    searchData = $filter('orderByPriority')(searchData);
                }
                else if(!angular.isArray(searchData)){
                    searchData = [searchData];
                }
            }
            if(!data.search.sets[searchSet]){
                data.search.sets[searchSet] = {};
            }
            data.search.sets[searchSet].data = searchData;
        },
        searchableAdd: function(searchSet, searchData){
            if(searchData){
                if(angular.isObject(searchData)){
                    searchData = $filter('orderByPriority')(searchData);
                }
                else if(!angular.isArray(searchData)){
                    searchData = [searchData];
                }
            }
            if(!data.search.sets[searchSet]){
                data.search.sets[searchSet] = {data: searchData};
            }
            if(!data.search.sets[searchSet].data){
                data.search.sets[searchSet].data = searchData;
            }
            else if(angular.isArray(data.search.sets[searchSet].data)){
                Array.prototype.splice.apply(data.search.sets[searchSet].data, [data.search.sets[searchSet].data.length, 0].concat(searchData));
            }
        },
        searchableRemove: function(searchSet, searchData){
            if(searchData && data.search.sets[searchSet] && data.search.sets[searchSet].data){
                if(!angular.isArray(searchData)){
                    var dataIdx = data.search.sets[searchSet].data.indexOf(searchData);
                    if(dataIdx !== -1){
                        data.search.sets[searchSet].data.splice(dataIdx, 1);
                    }
                }
                else{
                    angular.forEach(searchData, function(cData, cIdx){
                        var dataIdx = data.search.sets[searchSet].data.indexOf(cData);
                        if(dataIdx !== -1){
                            data.search.sets[searchSet].data.splice(dataIdx, 1);
                        }
                    });
                }
            }
        },

        // user api

        userGeoIP: function(){
            var defer = $q.defer();
            if(data.user.geoIP && data.user.geoIP.ip){
                defer.resolve(data.user.geoIP);
            }
            else{
                $http.get('https://freegeoip.net/json/').
                    success(function(res) {
                        data.user.geoIP = res;
                        defer.resolve(data.user.geoIP);
                    }).
                    error(function(res, status){
                        defer.resolve(data.user.geoIP);
                    });
            }
            return defer.promise;
        },

        // gets a flattened user list with no duplicates
        getUsersFlat: function(fromRoles){
            var defer = $q.defer();
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
                defer.resolve(users);
            });
            //return users;
            return defer.promise;
        },

        // Events API

        createEvent: function(title, description, users, type, attachments, date, end, notification){
            console.log('creating event:'+title+':'+description+':'+JSON.stringify(users)+':'+JSON.stringify(type)+':'+date);

            var newEvent = {title: title,
                description: description,
                users: users,
                type: type,
                attachments: attachments};
            if(date){
                newEvent.date = date;
            }
            if(end){
                newEvent.end = end;
            }
            if(notification){
                newEvent.notification = true;
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

	    addNewMessage: function(time, subject, users, message){
		    var fireRef = new Firebase('https://opentest.firebaseio.com/message/');
		    var fire = $firebase(fireRef);
		    var newMessage = {users:{},subject:subject,conversation:{}};
		    function CreateObject(propName, propValue){
			    this[propName] = propValue;
		    }
		    angular.forEach(users, function(active, username){
			    syncData('user/'+username+'/messages/unseen/'+fireRef.name()).$set(active);
		    });
		    var MyObj1 = new CreateObject(users,'true');
		    newMessage.conversation[new Date().getTime()] = {user:"irthism",text:message};
		    newMessage.users = MyObj1;
		    syncData('message').$add({
			    subject: newMessage.subject,
			    users: newMessage.users,
			    conversation: newMessage.conversation
		    }).then(function(messageRef){
			    angular.forEach(newMessage.users, function(active, username){
				    syncData('user/'+username+'/messages/unseen/'+messageRef.name()).$set(active);
			    });
		    });
		    console.log(time+": time added? "+subject+": subject added? "+users+": users added? "+message+": message added? ");
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
        sendNotification: function(sendTo, type, content, time, attachments){
            /** TODO:
             if(toUsers is object)
                - look for:
                    toUsers.users
                    toUsers.roles
                - if toUsers.roles
                    load all users in that role and put them into the users array

             if(toUsers is array or string)
                - treat as users
             */

            var users = {};
            var toUsers = [];
            var userListProms = [];

            if(angular.isObject(sendTo)){
                if(sendTo.users){
                    toUsers = (angular.isArray(sendTo.users))?sendTo.users:[sendTo.users];
                }
                if(sendTo.roles){
                    var userListDefer = $q.defer();
                    userListProms.push(userListDefer.promise);

                    api.getUsersFlat(sendTo.roles).then(function(roleUsers){
                        angular.forEach(roleUsers, function(username, index){
                            if(!users[username]){
                                users[username] = 'notification';
                            }
                        });
                        userListDefer.resolve(true);
                    });
                }
            }
            else{
                toUsers = (angular.isArray(sendTo))?sendTo:[sendTo];
            }

            if(!time){
                time = api.currentTime();
            }

            angular.forEach(toUsers, function(username, index){
                if(!users[username]){
                    users[username] = 'notification';
                }
            });

            // wait for any userList promises to resolve before creating the event
            $q.all(userListProms).then(function(){
                api.createEvent(type.charAt(0).toUpperCase()+type.slice(1)+' Notification', content, users, type, attachments, time, null, true);
            });


/**            var newNotification = {
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
 */
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
                if(data.user.activeOrder){
                    data.user.profile.$update({activeOrder: data.user.activeOrder});
                }
            }
            else{
                data.user.activeRole = 'anonymous';
                data.user.id = null;
                data.user.profile = null;
                data.user.events = {};
                data.user.messages = {};
                data.user.notifications = {};
                data.user.orders = {};
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

        activateUserOrder: function(orderID){
            data.user.activeOrder = orderID;

            if(data.user.profile){
                data.user.profile.$update({activeOrder: data.user.activeOrder});
            }
            else{
                // TODO: something like this for anonymous user cart saving
                // $localstorage.activeOrder = orderID;
            }
        },
        setUserOrder: function(order){
            if(data.user.profile && order.$id){
                if(!data.user.profile.orders || !data.user.profile.orders[order.$id] || data.user.profile.orders[order.$id] !== order.status){
                    var newOrder = {};
                    newOrder[order.$id] = order.status;
                    data.user.profile.$child('orders').$update(newOrder);
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
//            api.loadUserNotifications();
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
                    api.searchableAdd('events', [data.user.events[childSnapshot.name()]]);

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
                    api.searchableRemove('events', [data.user.events[oldChildSnapshot.name()]]);
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
                    api.searchableAdd('messages', [data.user.messages.unseen[childSnapshot.name()]]);
                });
                unseenMsgsBind.on('child_removed', function(oldChildSnapshot){
                    api.searchableRemove('messages', [data.user.messages.unseen[oldChildSnapshot.name()]]);
                    delete data.user.messages.unseen[oldChildSnapshot.name()];
                });

                var seenMsgBind = firebaseRef('user/'+data.user.id+'/messages/seen');
                seenMsgBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.messages.seen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                    api.searchableAdd('messages', [data.user.messages.seen[childSnapshot.name()]]);
                });
                seenMsgBind.on('child_removed', function(oldChildSnapshot){
                    api.searchableRemove('messages', [data.user.messages.seen[oldChildSnapshot.name()]]);
                    delete data.user.messages.seen[oldChildSnapshot.name()];
                });
            }
        },
/**        loadUserNotifications: function(){
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
 */
        loadUserOrders: function(){
            data.user.orders = {};
            if(data.user.id){
                var orderBind = firebaseRef('user/'+data.user.id+'/orders');
                orderBind.on('child_added', function(childSnapshot, prevChildName){
                    data.user.orders[childSnapshot.name()] = syncData('order/'+childSnapshot.name());
                    api.searchableAdd('orders-user', [data.user.orders[childSnapshot.name()]]);
                });
                orderBind.on('child_removed', function(oldChildSnapshot){
                    api.searchableRemove('orders-user', [data.user.orders[oldChildSnapshot.name()]]);
                    delete data.user.orders[oldChildSnapshot.name()];
                });
            }
        },

        loadManagerData: function(){
            data.manager.orders = {};
            if(data.user && data.user.profile && data.user.profile.roles && (data.user.profile.roles.admin || data.user.profile.roles.manager)) {
                var orderBind = firebaseRef('order');
                orderBind.on('child_added', function (childSnapshot, prevChildName) {
                    data.manager.orders[childSnapshot.name()] = childSnapshot.val();
                    api.searchableAdd('orders-manager', [data.manager.orders[childSnapshot.name()]]);
                });
                orderBind.on('child_removed', function (oldChildSnapshot) {
                    api.searchableRemove('orders-manager', [data.manager.orders[oldChildSnapshot.name()]]);
                    delete data.manager.orders[oldChildSnapshot.name()];
                });
            }
        }
    };

	var ui = {
		navify:'',
		notify:'',
		layout:{
			overlay:false,
			main:"",
			leftbar:"",
			rightbar:"",
			alertz:""
		},
		content:{
			event:"",
			info:"",
			inventory:"",
			notification:"",
			order:"",
			product:"",
			message:""
		}

	};
    return {
	    ui: ui,
        api: api,
        data: data
    };
});
