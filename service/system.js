angular.module('ecoposApp').factory('system',function(syncData, firebaseRef, $firebase, $q, $rootScope, $timeout, $log, cart) {

    var data = {
        user: {id: null, profile: null, activeRole: 'anonymous', messages: {}, events: {}, calendar: {}, session: {firstActiveRole: true, calendarEvents: {}}},
        employee: {shiftType: null},
        manager: {orders: {}},
        catalog: {products: {}, browse: {category: {}, categoryID: '', path: [], search: ''}},
	    params:{},
        view:''
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

        /**
        loadCategory: function(category, loadInto){
            var defer = $q.defer();

            if(category.$id && category.name) {
                if(!loadInto.children){
                    loadInto.children = {};
                }
                if (!loadInto.children[category.$id]) {
                    loadInto.children[category.$id] = {$id: category.$id, name: category.name};
                }

                if(category.$id !== category.name){
                    console.log('who is:'+category.$id+':'+category.name+':');
                }

                if(category.children) {
                    var childProms = [];
                    angular.forEach(category.children, function (subCat, subCatID) {
                        if (subCatID.indexOf('$') === -1) {
                            var cCatDefer = $q.defer();
                            var cCatProm = cCatDefer.promise;
                            childProms.push(cCatProm);
                            if (subCat.children) {
                                subCat.$id = subCatID;
                                api.loadCategory(subCat, loadInto.children[category.$id]).then(function () {
                                    cCatDefer.resolve(true);
                                });
                            }
                            else {
                                //console.log('what:'+subCatID+':'+JSON.stringify(subCat));
                                if(!loadInto.children[category.$id].children){
                                    loadInto.children[category.$id].children = {};
                                }
                                loadInto.children[category.$id].children[subCatID] = {$id: subCatID, product: true, name: subCat};
                                cCatDefer.resolve(true);
                            }
                        }
                    });
                    $q.all(childProms).then(function() {
                        defer.resolve(true);
                    });
                }
                else{
                    defer.resolve(true);
                }
            }
            else{
                defer.resolve(true);
            }

            return defer.promise;
        },
         */
/**
        loadCategoryProducts: function(category){
            angular.forEach(category.children, function(child, childID){
                if(child.name && child.price){
                    if(!data.catalog.products[childID]){
                        data.catalog.products[childID] = syncData('product/'+childID);
                    }


                    /**var product = syncData('product/'+childID);
                    product.$on('loaded', function(){
                        category.children[childID].fullData = product;
                    });
                     */
                    /**
                }
            });
        },

        loadCatalog: function(shopName){
            var defer = $q.defer();
            if(typeof shopName === 'undefined'){
                shopName = 'shop';
            }
            $log.debug('loading \''+shopName+'\' catalog...');
            var catalog = syncData(shopName);

            catalog.$on('loaded', function(){
                data.catalog[shopName] = catalog.$getRef();
                defer.resolve(true);
            });


            /**
            var catalog = syncData(shopName);
            catalog.$on('loaded', function(){
                api.loadCategory({$id: shopName, name: shopName, children: catalog}, data.catalog).then(function(){
                    defer.resolve(true);
                });
            });
            */
//            return defer.promise;
//        },

        loadCatalog: function(shopName, forceReload){
            var defer = $q.defer();
            if(typeof shopName === 'undefined'){
                shopName = 'shop';
            }
            if(typeof forceReload === 'undefined'){
                forceReload = false;
            }

            if(!data.catalog[shopName] || forceReload){
                data.catalog[shopName] = firebaseRef(shopName);
                defer.resolve(data.catalog[shopName]);

                /**
                var catRef = firebaseRef(shopName);
                catRef.once('value', function(snap){
                    var catSnap = snap.val();
                    //console.log('what:'+JSON.stringify(catSnap));
                    console.log('got:'+snap.name()+':'+snap.numChildren());
                    snap.forEach(function(childSnap){
                        console.log('child:'+childSnap.name()+':'+childSnap.numChildren());
                        childSnap.child('children').forEach(function(subChildSnap){
                            console.log('grandChild:'+subChildSnap.name()+':'+subChildSnap.numChildren());
                        });
                    });

                });
                     */
                /**var catalog = syncData(shopName);
                catalog.$on('loaded', function(){
                    data.catalog[shopName] = catalog.$getRef();
                    data.catalog.browse.category = {name: shopName, children: catalog};
                    defer.resolve(data.catalog[shopName]);
                });
                 */
            }
            else{
                defer.resolve(data.catalog[shopName]);
            }
            return defer.promise;
        },

        loadCatalogPath: function(catalog, path, productName){
            var defer = $q.defer();
            var pathParts = [];
            console.log('load catalog path \''+path+'\'');
            if(path){
                pathParts = path.split('/');
            }
            while(pathParts.length && pathParts[0] === ''){
                pathParts = pathParts.slice(1);
            }

            // reset breadcrumbs
            data.catalog.browse.path.length = 0;

            // initialize browsing state
            if(pathParts.length){
                var catChild = catalog.child(pathParts.join('/children/'));
                catChild.once('value', function(snap){
                    if(snap.val()){
                        data.catalog.browse.product = null;
                        if(productName) {
                            //console.log('donkey rider:'+productName+':'+JSON.stringify(snap.val()));
                            if(snap.val().children){
                                angular.forEach(snap.val().children, function(child, childId){
                                    if(!child.children && child === productName && !data.catalog.browse.product){
                                        data.catalog.browse.product = syncData('product/'+childId);
                                        data.catalog.browse.path.unshift({name: productName, path: '', fbRef: data.catalog.browse.product.$getRef()});
                                    }
                                });
                            }
                        }

                        var catTrace = catChild;
                        // load the breadcrumb
                        do{
                            var cPathEntry = {name: catTrace.name(), path: (catTrace !== catChild || (productName && data.catalog.browse.product))?pathParts.join('/'):'', fbRef: catTrace};
                            data.catalog.browse.path.unshift(cPathEntry);
                            catTrace.child('name').on('value', function(snapName){
                                if(snapName.ref().parent() && snapName.val()){
                                    angular.forEach(data.catalog.browse.path, function(entry, idx){
                                        if(entry.fbRef && snapName.ref().parent().toString() === entry.fbRef.toString()){
                                            data.catalog.browse.path[idx].name = snapName.val();
                                        }
                                    });
                                }
                            });
                            pathParts.pop();
                            catTrace = catTrace.parent().parent();
                        }while(catTrace && pathParts.length);

                        data.catalog.browse.path.unshift({name: catalog.name(), path: '/', fbRef: catalog});
                        data.catalog.browse.categoryID = path;
                        data.catalog.browse.category = {name: catChild.name(), children: $firebase(catChild.child('children'))};
                        defer.resolve(data.catalog.browse.category);
                    }
                    else{
                        // invalid category path, check if it's a product
                        var productCheck = pathParts.pop();
                        // take a piece off and try to load - this will repeat until a valid category is loaded
                        api.loadCatalogPath(catalog, pathParts.join('/'), productCheck).then(function(category){
                            defer.resolve(category);
                        });
                    }
                });
            }
            else{
                data.catalog.browse.categoryID = '';
                data.catalog.browse.category = {name: catalog.name(), children: $firebase(catalog)};
                data.catalog.browse.product = null;
                data.catalog.browse.path.push({name: catalog.name(), path: '/', fbRef: catalog});
                defer.resolve(data.catalog.browse.category);
            }

            return defer.promise;
        },

        saveProduct: function(product){
            product.$save();
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
