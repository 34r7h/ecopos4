

angular.module('ecoposApp')
  .controller('MainCtrl', function ($scope, syncData) {
		$scope.userz = syncData('userz/supplierx');
		syncData('userz/supplierx').$bind($scope, 'userz');



		$scope.userz.$add({
			name: 'Average Supplier',
			address: {
				number: 3100,
				street: 'Boardwalk',
				streetType: 'Blvd',
				city: 'Lund',
				province: 'BC',
				postal: 'V1K6V0'
			},
			contact: {
				phone: 6049335609,
				email: 'supplier@worksforlaughs.com'
			}


		});
		$scope.awesomeThings = [
			'HTML5 Boilerplate',
			'AngularJS',
			'Karma'
		];

  });
