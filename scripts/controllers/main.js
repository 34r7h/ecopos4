

angular.module('ecoposApp')
  .controller('MainCtrl', function ($scope, syncData) {
		syncData('widgets/alpha').$bind($scope, 'widget');
		$scope.awesomeThings = [
			'HTML5 Boilerplate',
			'AngularJS',
			'Karma'
		];

  });
