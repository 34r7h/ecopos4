angular.module('ecoposApp').factory('system',function(syncData, firebaseRef, $firebase, FBURL, $q, $rootScope, $timeout, $log, cart) {

    var data = {
        user: {id: null, profile: null, activeRole: 'anonymous', messages: {}, events: {}, calendar: {}, session: {firstActiveRole: true, calendarEvents: {}}},
        employee: {shiftType: null},
        manager: {orders: {}},
        store: {products: {}, catalogs: {}, browser: {}},
        params:{},
        breadcrumb:[],
        search:'',
        view:''
    };

    var CatalogBrowser = function(newCatalog){
        $log.debug('browser:'+newCatalog);
        var catalog = null; //(typeof newCatalog !== 'undefined') ? newCatalog : null;

        var categoryLoaded = function(catObj, prodURL){
            var catRef = null;
            if(catObj){
                if(typeof catObj.val === 'function'){
                    // if val function exists, assume it is a datasnapshot
                    // try to get the reference
                    if(typeof catObj.ref === 'function'){
                        if(catObj.val() && typeof catObj.hasChild === 'function' && catObj.hasChild('children')){
                            // has a truthy value and a reference and a child named children - this catObj is legit
                            catRef = catObj.ref();
                        }
                        else{
                            // apparently has a null or false value, but has a reference
                            // check if we can get a parent
                            if(typeof catObj.ref().parent === 'function' && typeof catObj.ref().parent().parent === 'function'){
                                var parent = catObj.ref().parent().parent();
                                if(parent){
                                    var refStr = (typeof catObj.ref().name === 'function')?catObj.ref().name():'';
                                    parent.once('value', function(snap){ categoryLoaded(snap, refStr); });
                                }
                            }
                            else{
                                // has ref and val but no children and no parent
                                $log.error('no parent for '+catObj.ref());
                            }
                        }
                    }
                    else{
                        // no ref, but apparently has a val
                        $log.error('no reference for '+catObj.val());
                    }
                }
                else{
                    // no val function, let's try to use it as a reference as it is
                    catRef = catObj;
                }

                if(catRef){
                    var afCategory = $firebase(catRef);
                    catRef.child('children').on('child_added', function(childSnap){
                        if(childSnap && childSnap.val()){
                            if(!childSnap.val().children){
                                api.loadInventoryProduct(childSnap.name());
                            }
                        }
                    });
                    afCategory.$on('loaded', function(){
                        // is there a category loaded? or is this the catalog?
                        // this check ensures catalog is first to load into category
                        if(public.category || afCategory.$getRef().toString()===catalog.toString()){
                            // legit category has a name and children
                            if(afCategory.name && afCategory.children){
                                // good to go...
                                if(public.category && typeof public.category.$getRef === 'function'){
                                    public.category.$getRef().child('children').off('child_added');
                                }
                                public.category = afCategory;
                                public.product = null;
                                public.productURI = '';

                                $log.debug('loaded category:'+public.category.name+' with '+Object.keys(public.category.children).length+' children');


                                //api.loadInventoryProducts(afCategory.children); // instead handled by the children.on('child_added')

                                // reset breadcrumb
                                if(!public.path){
                                    public.path = [];
                                }
                                public.path.length = 0;

                                var i = 0;
                                var bcTrace = public.category.$getRef();
                                var newPath = getPathForCatalogRef(bcTrace);
                                if(newPath !== public.pathStr){
                                    api.resetInventoryCache();
                                }
                                public.pathStr = newPath;
                                // maximum breadcrumbs is 10 (this is mostly a safety on unlikely chance of bcTrace.parent() causing infinite)
                                while(bcTrace && i < 10){
                                    var cPath = getPathForCatalogRef(bcTrace); //bcTrace.toString().replace(catalog.toString(), '').replace(/children\//g, '');
                                    if(!cPath){ cPath = '/'; }

                                    addBreadcrumb(bcTrace.name(), cPath, bcTrace, true);
                                    bcTrace = bcTrace.parent();
                                    if(bcTrace){
                                        bcTrace = bcTrace.parent();
                                    }
                                    i++;
                                }

                                var childProduct = null;
                                // was a productURL requested?
                                if(prodURL){
                                    var childProductID = null;
                                    angular.forEach(public.category.children, function(child, childID){
                                        if(child.url && child.url === prodURL){
                                            childProductID = childID;
                                            childProduct = child;
                                        }
                                    });
                                    if(childProduct && childProductID){
                                        $log.debug('product found \''+prodURL+'\' ['+childProductID+'] in \''+public.category.name+'\'');
                                        //public.pathStr += ((public.pathStr.charAt(public.pathStr.length-1)!=='/' && prodURL.charAt(0) !=='/')?'/':'')+prodURL;
                                        public.productURI = prodURL;
                                        public.setProduct(childProductID);
                                    }
                                    else{
                                        $log.debug('could not load product \''+prodURL+'\' in category \''+public.category.name+'\'');
                                    }
                                }

                            }
                        }
                        else{

                            console.log('loser:'+catChild);

                            // for some reason the sub-category came through while there is an outstanding request for the catalog $firebase
                            // re-queue that one
                            $log.debug('re-queue:'+afCategory.name);
                            afCategory.$getRef().once('value', function(snap){ categoryLoaded(snap, prodURL); });

                        }
                    });
                }
            }
            else{
                console.log('no catObj');
            }
        };

        var getPathForCatalogRef = function(fbRef){
            var path = ''+fbRef;
            if(path){
                if(catalog){
                    path = path.replace(catalog.toString(), '');
                }
                if(FBURL){
                    path = path.replace(FBURL, '');
                }
                path = path.replace(/children\//g, '');
            }
            return path;
        };

        var addBreadcrumb = function(name, path, fbRef, atStart){
            var newBC = {name: name, path: path, refPath: ''+fbRef}; // will toString() fbRef if possible
            if(atStart){
                public.path.unshift(newBC);
            }
            else{
                public.path.push(newBC);
            }
            if(fbRef && typeof fbRef.child === 'function'){
                fbRef.child('name').on('value', function(snap){
                    if(snap && snap.val()){
                        setBreadcrumbName(snap.val(), snap.ref().parent().toString());
                    }
                });
            }
        };

        var setBreadcrumbName = function(name, refPath){
            if(refPath && public.path.length){
                angular.forEach(public.path, function(cPath, idx){
                    if(cPath.refPath === refPath){
                        public.path[idx].name = name;
                    }
                });
            }
        };

        var public = {
            category: null,
            product: null,
            path: [],

            pathStr: '/',
            productURI: '',
            search: '',

            setCatalog: function(newCatalog){
                if(newCatalog !== catalog){
                    catalog = newCatalog;
                    return public.loadPath(public.pathStr);
                }
                var defer = $q.defer();
                defer.resolve(public.category);
                return defer.promise;
            },

            setPath: function(newPath){
                if (newPath === '') {
                    newPath = '/';
                }
                if (newPath !== public.getPathURI()) {
                    return public.loadPath(newPath);
                }
                var defer = $q.defer();
                defer.resolve(public.category);
                return defer.promise;
            },

            setProduct: function(productID){
                api.loadInventoryProduct(productID).then(function(product){
                    public.product = product;
                    if(!product){
                        $log.error('Could not find product \''+productID+'\' in store inventory.');
                    }
                    if(product && typeof product.$getRef === 'function' && product.$getRef()){
                        addBreadcrumb(product.name, public.pathStr, product.$getRef());
                    }
                });
            },

            getPathURI: function(){
                return public.pathStr+((public.pathStr.charAt(public.pathStr.length-1)!=='/' && public.productURI.charAt(0) !=='/')?'/':'')+public.productURI;
            },

            loadPath: function(path) {
                var defer = $q.defer();

                if(catalog){
                    $log.debug('load catalog path \'' + path + '\' in ' + catalog.name());

                    var pathParts = [];
                    if(path.charAt(0) === '/'){
                        path = path.substr(1);
                    }
                    if(path.charAt(path.length-1) === '/'){
                        path = path.substr(0, path.length-1);
                    }
                    if(path){
                        pathParts = path.split('/');
                    }
                    var emptyIdx;
                    while((emptyIdx = pathParts.indexOf('')) !== -1){
                        pathParts.splice(emptyIdx, 1);
                    }

                    var catChild = catalog;
                    if(pathParts.length) {
                        catChild = catalog.child('children/' + pathParts.join('/children/'));
                        catChild.once('value', categoryLoaded);
                    }
                    else {
                        $log.debug('category is catalog:'+catalog);
                        categoryLoaded(catalog);
                    }
                }
                else{
                    $log.debug('no catalog');
                    defer.reject('No catalog to load from');
                }
                return defer.promise;
            }
        };

        public.setCatalog(newCatalog);

        return public;
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

        addCatalogBrowser: function(name, catalogName){
            var defer = $q.defer();
            if(!data.store.browser[name]){
                api.loadCatalog(catalogName).then(function(catalog){
                    data.store.browser[name] = new CatalogBrowser(catalog);
                    defer.resolve(data.store.browser[name]);
                });
            }
            else{
                defer.resolve(data.store.browser[name]);
            }
            return defer.promise;
        },

        loadCatalog: function(name, forceReload){
            var defer = $q.defer();
            if(typeof name === 'undefined'){
                name = 'shop';
            }
            if(typeof forceReload === 'undefined'){
                forceReload = false;
            }

            if(!data.store.catalogs[name] || forceReload){
                data.store.catalogs[name] = firebaseRef(name);
                defer.resolve(data.store.catalogs[name]);
            }
            else{
                defer.resolve(data.store.catalogs[name]);
            }
            return defer.promise;
        },

        resetInventoryCache: function(){
            console.log('%chas '+Object.keys(data.store.products).length+' products $firebinded!', 'background-color:#222;color:#09f;font-size:1.75em');
            for (var prop in data.store.products) { if (data.store.products.hasOwnProperty(prop)) { delete data.store.products[prop]; } }
            console.log('%cnow '+Object.keys(data.store.products).length+' products $firebinded!', 'background-color:#222;color:#90f;font-size:1.24');
        },

        loadInventoryProduct: function(productID){
            var defer = $q.defer();
            if(!data.store.products[productID]){
                var productLoad = syncData('product/'+productID);
                productLoad.$on('loaded', function(){
                    data.store.products[productID] = productLoad;
                    if(data.store.products[productID].$value === null || !data.store.products[productID].name){
                        data.store.products[productID] = null;
                    }
                    defer.resolve(data.store.products[productID]);
                });
            }
            else{
                defer.resolve(data.store.products[productID].name?data.store.products[productID]:null);
            }
            return defer.promise;
        },

        /**
         * loads a list of inventory products
         * productList should be of format:
         *  [productID] = product
         *
         * if product has a property 'children', it will be skipped
         */
        loadInventoryProducts: function(productList){
            var defer = $q.defer();
            var productLoads = [];
            angular.forEach(productList, function(product, productID){
                if(product && !product.children){
                    productLoads.push(api.loadInventoryProduct(productID));
                }
            });
            if(productLoads.length){
                $q.all(productLoads).then(function(results){
                    defer.resolve();
                });
            }
            else{
                defer.resolve();
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