angular.module('ecoposApp').controller('TestCtrl',function($scope){

	$scope.items = [];
	$scope.canLoad = true;
	$scope.maxItems = 100;

	$scope.addItems = function () {
		for (var i = 0; i < 10; i++) {
			$scope.items.push({name:'item ' + ($scope.items.length + 1)});

			if ($scope.items.length >= $scope.maxItems) {
				$scope.canLoad = false;
				return;
			}
		}
	};

	$scope.reset = function () {
		$scope.items = [];
		$scope.canLoad = true;
		$scope.addItems();
	};

	$scope.reset();
});