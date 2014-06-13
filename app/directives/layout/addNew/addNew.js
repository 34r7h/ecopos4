/*jshint multistr: true */
angular.module('ecoposApp').directive('addNew', function(system) {
	return {
		restrict: 'EA',
		replace: true,
		controller: function($scope, system){

				$scope.dateTimeNow = function() {
					$scope.date = new Date();
				};
				$scope.dateTimeNow();

				$scope.toggleMinDate = function() {
					$scope.minDate = $scope.minDate ? null : new Date();
				};
				$scope.maxDate = new Date('2014-06-22');
				$scope.toggleMinDate();

				$scope.dateOptions = {
					'starting-day': 1
				};

				// Disable weekend selection
				$scope.disabled = function(calendarDate, mode) {
					return mode === 'day' && ( calendarDate.getDay() === 0 || calendarDate.getDay() === 6 );
				};

				$scope.showWeeks = true;
				$scope.toggleWeeks = function () {
					$scope.showWeeks = !$scope.showWeeks;
				};

				$scope.hourStep = 1;
				$scope.minuteStep = 15;

				$scope.timeOptions = {
					hourStep: [1, 2, 3],
					minuteStep: [1, 5, 10, 15, 25, 30]
				};

				$scope.showMeridian = true;
				$scope.timeToggleMode = function() {
					$scope.showMeridian = !$scope.showMeridian;
				};

			/*
			addNewByRole
			 */
			$scope.addNewByRole = {
				admin : {
					product:{
						options:[{model:'name',name:'',type:'text'},{model:'upc',name:'',type:'text'},{model:'supplier',name:'',type:'select', options:['supplier1','supplier2']},{model:'price',name:'',type:'number'}],
						icon:"gift"
					},
					user:{ // ecodocs: set roles and temp password
						options:{
							id:{model:'id', name:'',type:'text',valid:{required:true, pattern:"/^[a-zA-Z0-9]{4,60}$/"}},
							name:{model:'name', name:'',type:'text',valid:{required:true,pattern:"/^[-_. a-zA-Z]{4,60}$/"}},
							email:{model:'email', name:'',type:'email',valid:{required:true,maxLength:60,minLength:5}},
							roles:{model:'roles', name:'',type:'select',options:['admin','manager','employee','supplier','customer'],valid:{required:true,minLength:1}}
					},
						icon:"child"
					},
					info:{
						options:[{model:'title',name:'',type:'text'},{model:'content',name:'',type:'textarea'}],
						icon:"info"
					},
					event:{ // ecodocs: datetimepicker
						options:{
							title:{model:'title',name:'',type:'text'},
							description:{model:'description',name:'',type:'textarea'},
							users:{model:'users',name:'',type:'select',options:['user1','user2']},
							type:{model:'type',name:'',type:'select',options:['todo','event']},
							attachments:{model:'attachments',name:'',type:'select',options:['attach1','attach2']},
							date:{model:'date',name:'', type:'datetimepicker'},
							end:{model:'end',name:'',type:'datetimepicker'},
							notifications:{model:'notifications',name:'',type:'text'}
		},
						icon:"calendar"
					},
					category:{
						options:[{model:'name',name:'',type:'text'},{model:'parents',name:'', type:'select',options:['cat1','cat2']}],
						icon:"archive"
					},
					store:{
						options:[{model:'name',name:'',type:'text'}],
						icon:"sitemap"
					}
					/*		message:{
					 options:{
					 users:{model: 'users', name:'',type:'select',options:['irthism','user2']},
					 subject:{model: 'subject', name:'',type:'text'},
					 message:{model: 'message', name:'',type:'text'}
					 },
					 icon:"envelope"
					 },
					 activity:{
					 options:[{name:'users',type:'select',options:['user1','user2']},{name:'content',type:'text'},{name:'expire',type:'number'}],
					 icon:"globe"
					 }, */
				},
				manager:{
					product:{
						options:[{name:'name',type:'text'},{name:'upc',type:'text'},{name:'supplier',type:'select', options:['supplier1','supplier2']},{name:'price',type:'number'}],
						icon:"gift"
					},
					user:{ // ecodocs: set roles and temp password
						options:{
							id:{model:'id', name:'',type:'text',valid:{required:true, pattern:"/^[a-zA-Z0-9]{4,60}$/"}},
							name:{model:'name', name:'',type:'text',valid:{required:true,pattern:"/^[-_. a-zA-Z]{4,60}$/"}},
							email:{model:'email', name:'',type:'email',valid:{required:true,maxLength:60,minLength:5}},
							roles:{model:'roles', name:'',type:'select',options:['employee','supplier','customer'],valid:{required:true,minLength:1}}
						},
						icon:"child"
					},
					info:{
						options:[{name:'title',type:'text'},{name:'content',type:'text'}],
						icon:"info"
					},
					event:{ // ecodocs: datetimepicker
						options:{
							title:{model:'title',name:'',type:'text'},
							description:{model:'description',name:'',type:'text'},
							users:{model:'users',name:'',type:'select',options:['user1','user2']},
							type:{model:'type',name:'',type:'select',options:['todo','event']},
							attachments:{model:'attachments',name:'',type:'select',options:['attach1','attach2']},
							date:{model:'date',name:'', type:'datetimepicker'},
							end:{model:'end',name:'',type:'datetimepicker'},
							notifications:{model:'notifications',name:'',type:'text'}
						},
						icon:"calendar"
					},
					category:{
						options:[{name:'name',type:'text'},{name:'parents',type:'select',options:['cat1','cat2']}],
						icon:"archive"
					}
				},
				supplier:{
					product:{
						options:[{name:'name',type:'text'},{name:'upc',type:'text'},{name:'supplier',type:'select', options:['supplier1','supplier2']},{name:'price',type:'number'}],
						icon:"gift"
					},
					info:{
						options:[{name:'title',type:'text'},{name:'content',type:'text'}],
						icon:"info"
					}
				},
				employee:{
					product:{
						options:[{name:'name',type:'text'},{name:'upc',type:'text'},{name:'supplier',type:'select', options:['supplier1','supplier2']},{name:'price',type:'number'}],
						icon:"gift"
					},
					user:{ // ecodocs: set roles and temp password
						options:{
							id:{model:'id', name:'',type:'text',valid:{required:true, pattern:"/^[a-zA-Z0-9]{4,60}$/"}},
							name:{model:'name', name:'',type:'text',valid:{required:true,pattern:"/^[-_. a-zA-Z]{4,60}$/"}},
							email:{model:'email', name:'',type:'email',valid:{required:true,maxLength:60,minLength:5}},
							roles:{model:'roles', name:'',type:'select',options:['customer'],valid:{required:true,minLength:1}}
						},
						icon:"child"
					},
					info:{
						options:[{name:'title',type:'text'},{name:'content',type:'text'}],
						icon:"info"
					},
					event:{ // ecodocs: datetimepicker modelling
						options:{
							title:{model:'title',name:'',type:'text'},
							description:{model:'description',name:'',type:'text'},
							users:{model:'users',name:'',type:'select',options:['user1','user2']},
							type:{model:'type',name:'',type:'select',options:['todo','event']},
							attachments:{model:'attachments',name:'',type:'select',options:['attach1','attach2']},
							date:{model:'date',name:'', type:'datetimepicker'},
							end:{model:'end',name:'',type:'datetimepicker'},
							notifications:{model:'notifications',name:'',type:'text'}
						},
						icon:"calendar"
					}
				},
				customer:{
					info:{
						options:[{name:'title',type:'text'},{name:'content',type:'text'}],
						icon:"info"
					}
				}
			};

			$scope.theform = {};
			$scope.userActiveRole = system.data.user.activeRole;
			$scope.addNewThings = $scope.addNewByRole[$scope.userActiveRole];
			$scope.addNew = {
			/*	message:function(){
					$scope.subjectModel = $scope.addNewByRole[$scope.userActiveRole].message.options.subject.name;
					$scope.messageModel = $scope.addNewByRole[$scope.userActiveRole].message.options.message.name;
					$scope.usersModel = $scope.addNewByRole[$scope.userActiveRole].message.options.users.name;
					system.api.createConversation($scope.subjectModel, system.data.user.id, $scope.usersModel, $scope.messageModel);
					$scope.addNewByRole[$scope.userActiveRole].message.options.subject.name = "";
					$scope.addNewByRole[$scope.userActiveRole].message.options.message.name = "";
					$scope.addNewByRole[$scope.userActiveRole].message.options.users.name = "";
				}, */
				user:function(){
					console.log('new user');
					$scope.idModel = $scope.addNewByRole[$scope.userActiveRole].user.options.id.name;
					$scope.emailModel = $scope.addNewByRole[$scope.userActiveRole].user.options.email.name;
					$scope.rolesModel = $scope.addNewByRole[$scope.userActiveRole].user.options.roles.name;
					system.api.addNewUser($scope.idModel,$scope.displayNameModel, $scope.emailModel, $scope.rolesModel);
					$scope.addNewByRole[$scope.userActiveRole].user.options.id.name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options.email.name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options.displayName.name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options.roles.name = "";
				},
				info:function(){console.log('new info');},
				event:function(){
					console.log('new event');
					$scope.titleModel = $scope.addNewThings.event.options.title.name;
					$scope.descriptionModel = $scope.addNewThings.event.options.description.name;
					$scope.usersModel = $scope.addNewThings.event.options.users.name;
					$scope.typeModel = $scope.addNewThings.event.options.type.name;
					$scope.attachmentsModel = $scope.addNewThings.event.options.attachments.name;
					$scope.dateModel = $scope.addNewThings.event.options.date.name;
					$scope.endModel = $scope.addNewThings.event.options.end.name;
					$scope.notificationsModel = $scope.addNewThings.event.options.notifications.name;

					console.log(Date.parse($scope.dateModel) + ": "+$scope.titleModel);
					//system.api.createEvent(title, description, users, type, attachments, date, end, notification)
				},
				category:function(){console.log('new category');},
				store:function(){console.log('new store');},
				product:function(){console.log('new product');}
			};

		},
		templateUrl: 'app/directives/layout/addNew/addNew.html',
		link: function(scope, element, attrs, fn) {
			
		}
	};
});
