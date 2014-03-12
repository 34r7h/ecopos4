

angular.module('ecoposApp')
  .controller('MainCtrl', function ($rootScope, $scope, $log) {
        $scope.user = null;

        $scope.$on('$firebaseSimpleLogin:login', function(event, user){
        //    $log.debug('simpleLogin:login:'+JSON.stringify(user));
        });

        $scope.$on('$simpleLogin:profile:loaded', function(event, user){
            $scope.user = user;
        });

        $scope.$on('$firebaseSimpleLogin:logout', function(event){
            $log.debug('simpleLogin:logout:');
            $scope.user = null;
        });

        $scope.$on('$firebaseSimpleLogin:error', function(event, error){
            $log.error('simpleLogin:error:'+error);
        });


//        syncData('user/spiralsense').$bind($scope, 'user');

        /*
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

        */
		$scope.awesomeThings = [
			'HTML5 Boilerplate',
			'AngularJS',
			'Karma'
		];

  });
