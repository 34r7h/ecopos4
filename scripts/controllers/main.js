

angular.module('ecoposApp')
	.controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData, system, firebaseRef) {
        $scope.user = {};
        $scope.user.calendar = {};
		var unbindUser = null;
		var firstActiveRole = false;
        var calendarEvents = {};

		$scope.$watch('activeRole', function(value){
			if(value){
				// don't reload state if they just logged in - routesecurity is taking care of that
				if(!firstActiveRole){
					$state.go('main');
				}
				else{
					firstActiveRole = false;
				}
			}
		});

		$scope.$on('$simpleLogin:profile:loaded', function(event, user){
			user.$bind($scope, 'user.bind').then(function(unbind){
				unbindUser = unbind;

				$scope.user.id = user.$id;

				// load user data that affects how the state will load
				firstActiveRole = true;
				setDefaultActiveRole(user);

				// notify that the user is bound and ready to load whatever state
				$rootScope.$broadcast('ecopos:user:bound', user);

				// continue loading any user data that doesn't affect how the state loads
				loadUserMessages(user.$id);
				loadUserOrders(user.$id);
                loadUserEvents(user.$id);
			});
		});

		$scope.$on('$firebaseSimpleLogin:logout', function(event){
			$log.debug('simpleLogin:logout:');
			if(typeof unbindUser === 'function'){
				unbindUser();
				$scope.user = {};
				$scope.activeRole = 'anonymous';
			}
		});

		$scope.$on('$firebaseSimpleLogin:error', function(event, error){
			$log.error('simpleLogin:error:'+error);
		});

		function setDefaultActiveRole(user){
			$scope.activeRole = 'anonymous';
			if(user.roles){
				if(user.roles.admin){
					$scope.activeRole = 'admin';
				}
				else if(user.roles.manager){
					$scope.activeRole = 'manager';
				}
				else if(user.roles.employee){
					$scope.activeRole = 'employee';
				}
				else if(user.roles.supplier){
					$scope.activeRole = 'supplier';
				}
				else if(user.roles.customer){
					$scope.activeRole = 'customer';
				}
			}
		}

        function setCalendarEvent(event){
            if(event.date){
                var cDate = new Date(event.date);
                var cMonth = cDate.getMonth()+1;
                var cDay = cDate.getDate();
                var cYear = cDate.getFullYear();
                if(!$scope.user.calendar[cYear]){
                    $scope.user.calendar[cYear] = {};
                }
                if(!$scope.user.calendar[cYear][cMonth]){
                    $scope.user.calendar[cYear][cMonth] = {};
                }
                if(!$scope.user.calendar[cYear][cMonth][cDay]){
                    $scope.user.calendar[cYear][cMonth][cDay] = {};
                }
                $scope.user.calendar[cYear][cMonth][cDay][event.$id] = event.title;

                if(calendarEvents[event.$id]){
                    var oldDate = calendarEvents[event.$id];
                    if(oldDate.year != calendarEvents[event.$id].year || oldDate.month != calendarEvents[event.$id].month || oldDate.day != calendarEvents[event.$id].day){
                        if($scope.user.calendar[oldDate.year] && $scope.user.calendar[oldDate.year][oldDate.month] && $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day] && $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id]){
                            delete $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id];
                        }
                    }
                }
                calendarEvents[event.$id] = {year: cYear, month: cMonth, day: cDay};
                $rootScope.$broadcast('calendar:changed');
            }
        }

        function removeCalendarEvent(eventID){
            if(calendarEvents[eventID]){
                var oldDate = calendarEvents[eventID];
                if($scope.user.calendar[oldDate.year] && $scope.user.calendar[oldDate.year][oldDate.month] && $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day] && $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id]){
                    delete $scope.user.calendar[oldDate.year][oldDate.month][oldDate.day][event.$id];
                }
                delete calendarEvents[eventID];
                $rootScope.$broadcast('calendar:changed');
            }
        }

        function loadUserEvents(userID){
            $scope.user.events = {};

            var eventBind = syncData('user/'+userID+'/events').$getRef();
            eventBind.on('child_added', function(childSnapshot, prevChildName){
                var cEvent = syncData('event/'+childSnapshot.name());
                $scope.user.events[childSnapshot.name()] = cEvent;

                cEvent.$on('loaded', function(field){
                    if(cEvent.date){
                        setCalendarEvent(cEvent);
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
                delete $scope.user.events[oldChildSnapshot.name()];
            });
        }

		function loadUserMessages(userID){
			$scope.user.messages = {seen: {}, unseen: {}};

			// angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
			var unseenMsgsBind = syncData('user/'+userID+'/messages/unseen').$getRef();
			unseenMsgsBind.on('child_added', function(childSnapshot, prevChildName){
				$scope.user.messages.unseen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
			});
			unseenMsgsBind.on('child_removed', function(oldChildSnapshot){
				// for 3-way data binding... (not working)
				//if(typeof messageBinds[oldChildSnapshot.name()] === 'function'){
				//    messageBinds[oldChildSnapshot.name()]();
				//}

				delete $scope.user.messages.unseen[oldChildSnapshot.name()];
			});

			// angularfire bug: need to use $getRef() to bind core Firebase events. src: https://github.com/firebase/angularFire/issues/272
			var seenMsgBind = syncData('user/'+userID+'/messages/seen').$getRef();
			seenMsgBind.on('child_added', function(childSnapshot, prevChildName){
				$scope.user.messages.seen[childSnapshot.name()] = syncData('message/'+childSnapshot.name());
			});
			seenMsgBind.on('child_removed', function(oldChildSnapshot){
				delete $scope.user.messages.seen[oldChildSnapshot.name()];
			});
		}

		function loadUserOrders(userID){
			$scope.user.orders = {};
			var orderBind = syncData('user/'+userID+'/orders').$getRef();
			orderBind.on('child_added', function(childSnapshot, prevChildName){
				$scope.user.orders[childSnapshot.name()] = syncData('order/'+childSnapshot.name());
			});
			orderBind.on('child_removed', function(oldChildSnapshot){
				delete $scope.user.orders[oldChildSnapshot.name()];
			});
		}

        $scope.newEvent = {
            title: '',
            description: '',
            users: [],
            type: 'todo',
            date: new Date(),
            dueDate: false
        };

        $scope.createEvent = function(){
            var users = {};
            /**
            if($scope.user && $scope.user.id){
                users[$scope.user.id] = true;
            }
             */
            angular.forEach($scope.newEvent.users, function(username, index){
                users[username] = true;
            });

            var dateStamp = 0;
            if($scope.newEvent.type === 'calendar' || ($scope.newEvent.type === 'todo' && $scope.newEvent.dueDate)){
                dateStamp = $scope.newEvent.date.getTime();
            }

            // TODO: need some validation here (or in the system.createEvent as a promise)
            system.createEvent($scope.newEvent.title, $scope.newEvent.description, users, $scope.newEvent.type, dateStamp);
        };

	});