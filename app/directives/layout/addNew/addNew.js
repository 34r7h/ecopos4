angular.module('ecoposApp').directive('addNew', function(system) {
	return {
		restrict: 'EA',
		replace: true,
		controller: function($scope, system){

			/*
			addNewByRole
			 */
			$scope.addNewByRole = {
				admin : {
					product:{
						options:[{name:'name',type:'text'},{name:'upc',type:'text'},{name:'supplier',type:'select', options:['supplier1','supplier2']},{name:'price',type:'number'}],
						icon:"gift"
					},
					user:{
						options:[
							{model:'id', name:'',type:'text',valid:{required:true, pattern:"/^[a-zA-Z0-9]{4,60}$/"}},
							{model:'name', name:'',type:'text',valid:{required:true,pattern:"/^[-_. \a-zA-Z]{4,60}$/"}},
							{model:'email', name:'',type:'email',valid:{required:true,maxLength:60,minLength:5}},
							{model:'roles', name:'',type:'select',options:['admin','manager','employee','supplier','customer'],valid:{required:true,minLength:1}}
						],
						icon:"child"
					},
					info:{
						options:[{name:'title',type:'text'},{name:'content',type:'text'}],
						icon:"info"
					},
					event:{
						options:[{name:'title',type:'text'},{name:'event type',type:'select',options:['event type1','event type2']},{name:'time',type:'number'},{name:'users',type:'select',options:['user1','user2']}],
						icon:"calendar"
					},
					message:{
						options:[
							{model: 'users', name:'',type:'select',options:['irthism','user2']},
							{model: 'subject', name:'',type:'text'},
							{model: 'message', name:'',type:'text'}
						],
						icon:"envelope"
					},
					activity:{
						options:[{name:'users',type:'select',options:['user1','user2']},{name:'content',type:'text'},{name:'expire',type:'number'}],
						icon:"globe"
					},
					category:{
						options:[{name:'name',type:'text'},{name:'parents',type:'select',options:['cat1','cat2']}],
						icon:"archive"
					},
					store:{
						options:[{name:'name',type:'text'}],
						icon:"sitemap"
					}
				},
				manager:{},
				supplier:{},
				employee:{},
				customer:{}
			};

			$scope.theform = {};
			$scope.addNew = {
				message:function(){
					$scope.subjectModel = $scope.addNewByRole[$scope.userActiveRole].message.options[1].name;
					$scope.messageModel = $scope.addNewByRole[$scope.userActiveRole].message.options[2].name;
					$scope.usersModel = $scope.addNewByRole[$scope.userActiveRole].message.options[0].name;
					system.api.createConversation($scope.subjectModel, system.data.user.id, $scope.usersModel, $scope.messageModel);
					$scope.addNewByRole[$scope.userActiveRole].message.options[1].name = "";
					$scope.addNewByRole[$scope.userActiveRole].message.options[2].name = "";
					$scope.addNewByRole[$scope.userActiveRole].message.options[0].name = "";
				},
				user:function(){
					console.log('new user');
					$scope.idModel = $scope.addNewByRole[$scope.userActiveRole].user.options[0].name;
					$scope.emailModel = $scope.addNewByRole[$scope.userActiveRole].user.options[2].name;
					$scope.displayNameModel = $scope.addNewByRole[$scope.userActiveRole].user.options[1].name;
					$scope.rolesModel = $scope.addNewByRole[$scope.userActiveRole].user.options[3].name;
					system.api.addNewUser($scope.idModel,$scope.displayNameModel, $scope.emailModel, $scope.rolesModel);
					$scope.addNewByRole[$scope.userActiveRole].user.options[0].name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options[1].name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options[2].name = "";
					$scope.addNewByRole[$scope.userActiveRole].user.options[3].name = "";
				},
				info:function(){console.log('new info');},
				event:function(){console.log('new event');},
				category:function(){console.log('new category');},
				store:function(){console.log('new store');},
				activity:function(){console.log('new activity');},
				product:function(){console.log('new product');}
			};
			$scope.userActiveRole = system.data.user.activeRole;
			$scope.addNewThings = $scope.addNewByRole[$scope.userActiveRole];
		},
		templateUrl: 'app/directives/layout/addNew/addNew.html',
		link: function(scope, element, attrs, fn) {
			
		}
	};
});
