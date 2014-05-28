angular.module('ecoposApp').directive('addNew', function(system) {
	return {
		restrict: 'E',
		replace: true,
		controller: function($scope, system){
			$scope.addNewByRole = {
				admin : {
					product:{
						options:[{name:'name',type:'text'},{name:'upc',type:'text'},{name:'supplier',type:'select', options:['supplier1','supplier2']},{name:'price',type:'number'}],
						icon:"gift"
					},
					users:{
						options:[{name:'name',type:'text'},{name:'roles',type:'select',options:['role1','role2']},{name:'email',type:'text'}],
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


			$scope.addNew = {
				message:function(){
					$scope.subjectModel=$scope.addNewByRole.admin.message.options[1].name;
					$scope.messageModel =$scope.addNewByRole.admin.message.options[2].name;
					$scope.usersModel=$scope.addNewByRole.admin.message.options[0].name;
					$scope.timestampModel=Date();
					system.api.addNewMessage($scope.timestampModel, $scope.subjectModel, $scope.usersModel, $scope.messageModel);
				},
				users:function(){console.log('new users');},
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
