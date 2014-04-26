angular.module('ecoposApp')
	.directive('infiniteScroll', [ "$window", function ($window) {
		return {
			link:function (scope, element, attrs) {
				var offset = parseInt(attrs.threshold) || 0;
				var e = element[0];

				element.bind('scroll', function () {
					if (scope.$eval(attrs.canLoad) && e.scrollTop + e.offsetHeight >= e.scrollHeight - offset) {
						scope.$apply(attrs.infiniteScroll);
					}

					/*
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
					 */
				});
			}
		};
	}]);