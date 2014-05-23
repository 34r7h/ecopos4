angular.module('ecoposApp').directive('addNew', function(system) {
	return {
		restrict: 'E',
		replace: true,

		templateUrl: 'app/directives/layout/addNew/addNew.html',
		link: function(scope, element, attrs, fn) {
			scope.addNewByRole = {
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
						options:[{name:'users',type:'select',options:['user1','user2']},{name:'subject',type:'text'},{name:'content',type:'text'}],
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
			scope.userActiveRole = system.data.user.activeRole;
			scope.addNewThings = scope.addNewByRole[scope.userActiveRole];
		}
	};
});
