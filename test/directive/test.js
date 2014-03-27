angular.module('ecoposApp').directive('test', function(simpleLogin,profileManager, $rootScope, syncData, $log) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'test/directive/test.html',
		link: function(scope, element, attrs) {
            scope.pass = null;
            scope.err = null;
            scope.email = null;
            scope.confirm = null;
            scope.createMode = false;
            scope.passwordMode = false;
            scope.profileMode = false;
            scope.userAuth = null;
            scope.username = null;
            scope.displayName = null;

            scope.login = function(service) {
                simpleLogin.login(service, function(err, user) {
                    if(user){
                        profileManager.loadProfile(user.uid).then(function(success){
                        }, function(err){
                            // no profile, setup the form to create it
                            if(user.provider === 'facebook'){
                                scope.username = user.username;
                                scope.email = user.emails[0].value?user.emails[0].value:null;
                                scope.displayName = user.displayName;
                            }
                            else if(user.provider === 'twitter'){
                                scope.username = user.username;
                                scope.email = user.email; // no such luck from twitter
                                scope.displayName = user.displayName;
                            }
                            scope.profileMode = true; // trigger the ng-show
                        });
                    }
                    scope.userAuth = user;
                    scope.err = err? err + '' : null;
                });
            };

            scope.loginPassword = function(cb) {
                scope.err = null;
                if( !scope.email ) {
                    scope.err = 'Please enter an email address';
                }
                else if( !scope.pass ) {
                    scope.err = 'Please enter a password';
                }
                else {
                    simpleLogin.loginPassword(scope.email, scope.pass, function(err, user) {
                        if(!err){
                            if(user){
                                // user authenticated, try to load the profile
                                profileManager.loadProfile(user.uid).then(function(success){
                                }, function(err){
                                    // no profile, setup the form to create it
                                    scope.username = user.email.split('@', 2)[0];
                                    scope.email = user.email;
                                    scope.displayName = scope.username;
                                    scope.profileMode = true; // trigger the ng-show
                                });
                            }
                        }

                        scope.userAuth = user;

                        scope.err = err? err + '' : null;
                        if( !err && cb ) {
                            cb(user);
                        }
                    });
                }
            };

            scope.logout = simpleLogin.logout;

            scope.recoverPassword = function(){
                simpleLogin.forgotPassword(scope.email, function(err){
                    if(err){
                        scope.err = err? err + '' : null;
                    }
                });
            };

            scope.createAccount = function() {
                // this is for creating an email/password account
                function assertValidLoginAttempt() {
                    if( !scope.email ) {
                        scope.err = 'Please enter an email address';
                    }
                    else if( !scope.pass ) {
                        scope.err = 'Please enter a password';
                    }
                    else if( scope.pass !== scope.confirm ) {
                        scope.err = 'Passwords do not match';
                    }
                    return !scope.err;
                }

                scope.err = null;
                if( assertValidLoginAttempt() ) {
                    simpleLogin.createAccount(scope.email, scope.pass, function(err, user) {
                        if( err ) {
                            scope.err = err? err + '' : null;
                        }
                        else {
                            if(user){
                                // user authenticated, try to load the profile
                                profileManager.loadProfile(user.uid).then(function(success){
                                }, function(err){
                                    // no profile, setup the form to create it
                                    scope.username = user.email.split('@', 2)[0];
                                    scope.email = user.email;
                                    scope.displayName = scope.username;
                                    scope.profileMode = true; // trigger the ng-show
                                });
                            }
                        }
                        scope.userAuth = user;
                    });
                }
            };

            scope.cancelProfile = function(){
                simpleLogin.logout();
                if(scope.userAuth.provider === 'password'){
                    simpleLogin.removeAccount(scope.email, scope.pass);
                }
                else{
                    scope.email = null;
                }
                scope.err = null;
                scope.username = null;
                scope.displayName = null;
                scope.pass = null;
                scope.profileMode = false;
            };

            scope.createProfile = function(){
                // this is for creating the user profile (associates with auth account from email/password, facebook, twitter, etc)
                profileManager.createProfile(scope.userAuth.uid, scope.username, scope.email, scope.displayName).then(function(success){

                }, function(err){
                        scope.err = err;
                });
            };


            var unbindUser = null;



            scope.$on('$simpleLogin:profile:loaded', function(event, user){
                user.$bind(scope, 'userBind').then(function(unbind){
                    unbindUser = unbind;

                    $log.debug('rs2:'+$rootScope);

                    scope.user.id = user.$id;
                    $rootScope.toggle('myOverlay', 'off');

                    // load user data that affects how the state will load
                    scope.user.session.loginTime = new Date().getTime();
                    scope.user.session.firstActiveRole = true;
                    setDefaultActiveRole(user);

                    // notify that the user is bound and ready to load whatever state
                    $rootScope.$broadcast('ecopos:user:bound', user);

                    scope.user.session.bind = syncData('session/'+scope.user.session.loginTime+'-'+scope.user.id);
                    scope.user.session.bind.$set({ start: scope.user.session.loginTime });

                    // load user data extending beyond the core userProfile
                    loadUserMessages(user.$id);
                    loadUserOrders(user.$id);
                    loadUserEvents(user.$id);

                    // load role-specific data
                    if(user && user.roles){
                        if(user.roles.admin || user.roles.manager){
                            loadManagerData();
                        }
                    }
                });
            });

            scope.$on('$firebaseSimpleLogin:logout', function(event){
                $log.debug('simpleLogin:logout:');
                if(typeof unbindUser === 'function'){
                    if(scope.user.session.bind){
                        scope.user.session.bind.$update({end: new Date().getTime()});
                    }

                    unbindUser();
                    scope.user = {activeRole: 'anonymous', calendar: {}, session: {firstActiveRole: false, calendarEvents: {}}};
                    scope.employee = {shiftType: null};
                    scope.manager = {orders: {}};
                }
            });

            scope.$on('$firebaseSimpleLogin:error', function(event, error){
                $log.error('simpleLogin:error:'+error);
            });


            function setDefaultActiveRole(user){
                scope.user.activeRole = 'anonymous';
                if(user && user.roles){
                    if(user.roles.admin){
                        scope.user.activeRole = 'admin';
                    }
                    else if(user.roles.manager){
                        scope.user.activeRole = 'manager';
                    }
                    else if(user.roles.employee){
                        scope.user.activeRole = 'employee';
                    }
                    else if(user.roles.supplier){
                        scope.user.activeRole = 'supplier';
                    }
                    else if(user.roles.customer){
                        scope.user.activeRole = 'customer';
                    }
                }
            }

            // load data for the store manager
            function loadManagerData(){
                var orderBind = syncData('order').$getRef();
                orderBind.on('child_added', function(childSnapshot, prevChildName){
                    scope.manager.orders[childSnapshot.name()] = childSnapshot.val();
                });
            }

            // USER DATA LOADING
            function loadUserEvents(userID){
                scope.user.events = {};

                var eventBind = syncData('user/'+userID+'/events').$getRef();
                eventBind.on('child_added', function(childSnapshot, prevChildName){
                    var cEvent = syncData('event/'+childSnapshot.name());
                    scope.user.events[childSnapshot.name()] = cEvent;

                    cEvent.$on('loaded', function(field){
                        if(cEvent.date){
                            setCalendarEvent(cEvent);
                            if(cEvent.type === 'shift' && scope.user.session.loginTime && cEvent.users && cEvent.users[userID] && scope.user.session.loginTime >= cEvent.date && cEvent.end && scope.user.session.loginTime <= cEvent.end) {
                                scope.user.session.activeShift = cEvent;

                                var userEntry = cEvent.users[userID].split(':', 2);
                                scope.employee.shiftType = (userEntry.length > 1)?userEntry[1]:cEvent.users[userID];

                                if(scope.user.session.bind){
                                    scope.user.session.bind.$update({shiftType: scope.employee.shiftType});
                                }
                            }
                        }
                    });

                    cEvent.$on('change', function(field){
                        if(cEvent.date){
                            setCalendarEvent(cEvent);
                        }
                    });

                });
                eventBind.on('child_removed', function(oldChildSnapshot){
                    removeCalendarEvent(oldChildSnapshot.name());
                    delete scope.user.events[oldChildSnapshot.name()];
                });
            }

            function loadUserMessages(userID){
                scope.user.messages = {seen: {}, unseen: {}};

                // angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
                var unseenMsgsBind = syncData('user/'+userID+'/messages/unseen').$getRef();
                unseenMsgsBind.on('child_added', function(childSnapshot, prevChildName){
                    scope.user.messages.unseen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                });
                unseenMsgsBind.on('child_removed', function(oldChildSnapshot){
                    // for 3-way data binding... (not working)
                    //if(typeof messageBinds[oldChildSnapshot.name()] === 'function'){
                    //    messageBinds[oldChildSnapshot.name()]();
                    //}

                    delete scope.user.messages.unseen[oldChildSnapshot.name()];
                });

                // angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
                var seenMsgBind = syncData('user/'+userID+'/messages/seen').$getRef();
                seenMsgBind.on('child_added', function(childSnapshot, prevChildName){
                    scope.user.messages.seen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
                });
                seenMsgBind.on('child_removed', function(oldChildSnapshot){
                    delete scope.user.messages.seen[oldChildSnapshot.name()];
                });
            }

            function loadUserOrders(userID){
                scope.user.orders = {};
                var orderBind = syncData('user/'+userID+'/orders').$getRef();
                orderBind.on('child_added', function(childSnapshot, prevChildName){
                    scope.user.orders[childSnapshot.name()] = syncData('order/'+childSnapshot.name());
                });
                orderBind.on('child_removed', function(oldChildSnapshot){
                    delete scope.user.orders[oldChildSnapshot.name()];
                });
            }

            // CALENDAR AND EVENTS STUFF
            function setCalendarEvent(event){
                if(event.date){
                    var cDate = new Date(event.date);
                    var cMonth = cDate.getMonth()+1;
                    var cDay = cDate.getDate();
                    var cYear = cDate.getFullYear();
                    if(!scope.user.calendar[cYear]){
                        scope.user.calendar[cYear] = {};
                    }
                    if(!scope.user.calendar[cYear][cMonth]){
                        scope.user.calendar[cYear][cMonth] = {};
                    }
                    if(!scope.user.calendar[cYear][cMonth][cDay]){
                        scope.user.calendar[cYear][cMonth][cDay] = {};
                    }
                    scope.user.calendar[cYear][cMonth][cDay][event.$id] = event.title;

                    if(scope.user.session.calendarEvents[event.$id]){
                        var oldDate = scope.user.session.calendarEvents[event.$id];
                        if(oldDate.year !== scope.user.session.calendarEvents[event.$id].year || oldDate.month !== scope.user.session.calendarEvents[event.$id].month || oldDate.day !== scope.user.session.calendarEvents[event.$id].day){
                            if(scope.user.calendar[oldDate.year] && scope.user.calendar[oldDate.year][oldDate.month] && scope.user.calendar[oldDate.year][oldDate.month][oldDate.day] && scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id]){
                                delete scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id];
                            }
                        }
                    }
                    scope.user.session.calendarEvents[event.$id] = {year: cYear, month: cMonth, day: cDay};
                    $rootScope.$broadcast('calendar:changed');
                }
            }

            function removeCalendarEvent(eventID){
                if(scope.user.session.calendarEvents[eventID]){
                    var oldDate = scope.user.session.calendarEvents[eventID];
                    if(scope.user.calendar[oldDate.year] && scope.user.calendar[oldDate.year][oldDate.month] && scope.user.calendar[oldDate.year][oldDate.month][oldDate.day] && scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID]){
                        delete scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][eventID];
                    }
                    delete scope.user.session.calendarEvents[eventID];
                    $rootScope.$broadcast('calendar:changed');
                }
            }

		}
	};
});
