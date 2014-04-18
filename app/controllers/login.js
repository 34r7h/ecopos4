

angular.module('ecoposApp')
  .controller('LoginController', function($scope, simpleLogin, profileManager, $location) {
    $scope.pass = null;
    $scope.err = null;
    $scope.email = null;
    $scope.confirm = null;
    $scope.createMode = false;
    $scope.passwordMode = false;
    $scope.profileMode = false;
    $scope.user = null;
    $scope.username = null;
    $scope.displayName = null;

    $scope.login = function(service) {
      simpleLogin.login(service, function(err, user) {
          if(user){
              profileManager.loadProfile(user.uid).then(function(success){
              }, function(err){
                  // no profile, setup the form to create it
                  if(user.provider === 'facebook'){
                      $scope.username = user.username;
                      $scope.email = user.emails[0].value?user.emails[0].value:null;
                      $scope.displayName = user.displayName;
                  }
                  else if(user.provider === 'twitter'){
                      $scope.username = user.username;
                      $scope.email = user.email; // no such luck from twitter
                      $scope.displayName = user.displayName;
                  }
                  $scope.profileMode = true; // trigger the ng-show
              });
          }
	      $scope.user = user;
        $scope.err = err? err + '' : null;
      });
    };

    $scope.loginPassword = function(cb) {
      $scope.err = null;
      if( !$scope.email ) {
        $scope.err = 'Please enter an email address';
      }
      else if( !$scope.pass ) {
        $scope.err = 'Please enter a password';
      }
      else {
        simpleLogin.loginPassword($scope.email, $scope.pass, function(err, user) {
            if(!err){
                if(user){
                    // user authenticated, try to load the profile
                    profileManager.loadProfile(user.uid).then(function(success){
                    }, function(err){
                        // no profile, setup the form to create it
                        $scope.username = user.email.split('@', 2)[0];
                        $scope.email = user.email;
                        $scope.displayName = $scope.username;
                        $scope.profileMode = true; // trigger the ng-show
                    });
                }
            }

            $scope.user = user;

          $scope.err = err? err + '' : null;
          if( !err && cb ) {
            cb(user);
          }
        });
      }
    };

    $scope.logout = simpleLogin.logout;

    $scope.recoverPassword = function(){
        simpleLogin.forgotPassword($scope.email, function(err){
            if(err){
                $scope.err = err? err + '' : null;
            }
        });
    };

    $scope.createAccount = function() {
        // this is for creating an email/password account
      function assertValidLoginAttempt() {
        if( !$scope.email ) {
          $scope.err = 'Please enter an email address';
        }
        else if( !$scope.pass ) {
          $scope.err = 'Please enter a password';
        }
        else if( $scope.pass !== $scope.confirm ) {
          $scope.err = 'Passwords do not match';
        }
        return !$scope.err;
      }

      $scope.err = null;
      if( assertValidLoginAttempt() ) {
        simpleLogin.createAccount($scope.email, $scope.pass, function(err, user) {
          if( err ) {
            $scope.err = err? err + '' : null;
          }
          else {
              if(user){
                  // user authenticated, try to load the profile
                  profileManager.loadProfile(user.uid).then(function(success){
                  }, function(err){
                      // no profile, setup the form to create it
                      $scope.username = user.email.split('@', 2)[0];
                      $scope.email = user.email;
                      $scope.displayName = $scope.username;
                      $scope.profileMode = true; // trigger the ng-show
                  });
              }
          }
            $scope.user = user;
        });
      }
    };

    $scope.cancelProfile = function(){
        simpleLogin.logout();
        if($scope.user.provider === 'password'){
            simpleLogin.removeAccount($scope.email, $scope.pass);
        }
        else{
            $scope.email = null;
        }
        $scope.err = null;
        $scope.username = null;
        $scope.displayName = null;
        $scope.pass = null;
        $scope.profileMode = false;
    };

    $scope.createProfile = function(){
        // this is for creating the user profile (associates with auth account from email/password, facebook, twitter, etc)
        profileManager.createProfile($scope.user.uid, $scope.username, $scope.email, $scope.displayName).then(function(success){

        }, function(err){
            $scope.err = err;
        });
    };

  });
