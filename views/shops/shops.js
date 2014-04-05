angular.module('ecoposApp').controller('ShopsCtrl',function($scope, $stateParams){
    if($stateParams.categoryID){
        $scope.categoryID = $stateParams.categoryID;
    }

});