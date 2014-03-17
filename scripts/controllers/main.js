

angular.module('ecoposApp')
  .controller('MainCtrl', function ($rootScope, $scope, $log, $state, $timeout, syncData) {
        var unbindUser = null;

        $scope.$on('$firebaseSimpleLogin:login', function(event, user){
        //    $log.debug('simpleLogin:login:'+JSON.stringify(user));
        });

        $scope.$watch('activeRole', function(value){
            if(value){
                $state.go('main');
            }
        });

        $scope.$on('$simpleLogin:profile:loaded', function(event, user){
            user.$bind($scope, 'user').then(function(unbind){
                unbindUser = unbind;

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
