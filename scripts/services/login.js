
angular.module('angularfire.login', ['firebase', 'angularfire.firebase', 'angular-md5'])

  .run(function(simpleLogin) {
    simpleLogin.init();
  })

  .factory('simpleLogin', function($rootScope, profileManager, $firebaseSimpleLogin, firebaseRef, $q, $timeout, $log) {
    function assertAuth() {
      if( auth === null ) { throw new Error('Must call loginService.init() before using its methods'); }
    }

    var auth = null;
    return {
      init: function() {
        auth = $firebaseSimpleLogin(firebaseRef());
        return auth;
      },

      logout: function() {
        assertAuth();
        auth.$logout();
      },


        activateCurrent: function(){
            // activates the currently logged in user
            assertAuth();
            auth.$getCurrentUser().then(function(user){
                if(user){
                    profileManager.loadProfile(user.uid).then(function(success){
                        },
                        function(err){
                            auth.$logout();
                        });
                }
            });
        },

      /**
       * @param {string} provider
       * @param {Function} [callback]
       * @returns {*}
       */
      login: function(provider, callback) {
        assertAuth();
        auth.$login(provider, {rememberMe: true}).then(function(user) {
          if( callback ) {
            //todo-bug https://github.com/firebase/angularFire/issues/199
            $timeout(function() {
              callback(null, user);
            });
          }
        }, callback);
      },

      /**
       * @param {string} email
       * @param {string} pass
       * @param {Function} [callback]
       * @returns {*}
       */
      loginPassword: function(email, pass, callback) {
        assertAuth();
        auth.$login('password', {
          email: email,
          password: pass,
          rememberMe: true
        }).then(function(user) {
            if( callback ) {
              //todo-bug https://github.com/firebase/angularFire/issues/199
              $timeout(function() {
                callback(null, user);
              });
            }
          }, callback);
      },

      forgotPassword: function(email, cb) {
          assertAuth();
          if(typeof cb === 'undefined'){ cb = function(){}; }
          auth.$sendPasswordResetEmail(email)
              .then(function(){ cb(null); }, cb);
      },

      changePassword: function(opts) {
        assertAuth();
        var cb = opts.callback || function() {};
        if( !opts.oldpass || !opts.newpass ) {
          $timeout(function(){ cb('Please enter a password'); });
        }
        else if( opts.newpass !== opts.confirm ) {
          $timeout(function() { cb('Passwords do not match'); });
        }
        else {
          auth.$changePassword(opts.email, opts.oldpass, opts.newpass)
            .then(function() { cb(null); }, cb);
        }
      },

      createAccount: function(email, pass, callback) {
        assertAuth();
          profileManager.emailAvailable(email).then(function(){
            auth.$createUser(email, pass).then(function(user) { callback(null, user); }, callback);
          },
          function(err){
              if(callback){
                  callback('email address in use.');
              }
          });
      },

      removeAccount: function(email, pass){
        assertAuth();
        auth.$removeUser(email, pass);
      }
    };
  })

    .factory('profileManager', function($rootScope, firebaseRef, $firebase, syncData, $q, md5, $timeout, $log){
        function reserveHash(hashReq, claimHash){
            // promise that this hashReq is reserved for the authenticated user
            // resolves true if all requested hashes are reserved
            // rejects hashReq key name as error value on first failed hash
            var defer = $q.defer();

            var promises = [];
            angular.forEach(hashReq, function(value, key){
                var newP = $q.defer();
                promises.push(newP.promise);

                var hashPath = 'hash/'+key+'/'+((key==='UP')?value.key:md5.createHash(value.key));
                var hashVal = ((key==='UP')?value.value:md5.createHash(value.value));
                var cHashRef = firebaseRef(hashPath);

                cHashRef.on('value', function(snap){
                        var cHashVal = snap.val();
                        if(!cHashVal){
                            // hash is unclaimed
                            if(claimHash){
                                cHashRef.set(hashVal, function(err){
                                    if(!err){
                                        newP.resolve(true);
                                    }
                                    else{
                                        newP.reject(key);
                                    }
                                });
                            }
                            else{
                                // hash available, but not claimed
                                newP.resolve(true);
                            }
                        }
                        else{
                            if(claimHash && cHashVal === hashVal){
                                // we have already claimed this hash
                                newP.resolve(true);
                            }
                            else{
                                // hash is not available
                                newP.reject(key);
                            }
                        }
                    },
                    function(err){
                        newP.reject(key);
                    });
            });

            $q.all(promises).then(
                function(resolutions){
                    // all hashes are cleared
                    defer.resolve(true);
                },
                function(err){
                    defer.reject(err);
                }
            );

            return defer.promise;
        }

        return {
            emailAvailable: function(email){
                return reserveHash({UE: {key: email, value: 'checking...'}});
            },

            createProfile: function(uid, username, email, displayName){
                var defer = $q.defer();
                // create the new profile, including hash-links

                var hashCore = {UN:{key: username, value: email}, UE: {key: email, value: uid}};
                // first check if the UN (username) and UE (email) hashes are available
                reserveHash(hashCore).then(
                    function(success){
                        // username and email hash available and currently un-claimed
                        // add the uid hash and claim them all!  hash <3!
                        hashCore.UP = {key: uid, value: username};
                        reserveHash(hashCore, true).then(
                            function(success){
                                // all hashes are claimed, build the user
                                var userProfile = firebaseRef('user/'+username);
                                var linkAccounts = {};
                                linkAccounts[uid] = true;
                                userProfile.set({
                                    email: email,
                                    displayName: displayName,
                                    linkedAccount: linkAccounts
                                }, function(err){
                                    if(!err){
                                        defer.resolve(true);
                                    }
                                    else{
                                        defer.reject(err);
                                    }
                                });
                            },
                            function(err){
                               defer.reject('Could not claim hash:'+err);
                            }
                        );
                    },
                    function(err){
                        switch(err){
                            case 'UN':
                                defer.reject('username exists.');
                                break;
                            case 'UE':
                                defer.reject('email address in use.');
                                break;
                            default:
                                defer.reject(err);
                        }
                    }
                );

                return defer.promise;

            },
            loadProfile: function(uid){
                var defer = $q.defer();
                // check if there is a username associated with given uid
                firebaseRef('hash/UP/'+uid).on('value', function(snap){
                        var username = snap.val();
                        if(username){
                            var userProfile = syncData('user/'+username);
                            userProfile.$on('loaded', function(){
                                userProfile.$off('loaded');
                                $rootScope.$broadcast('$simpleLogin:profile:loaded', userProfile);
                            });
                            defer.resolve(true);
                        }
                        else{
                            defer.reject();
                        }
                },
                function(err){
                    defer.reject('Unrecognized user.');
                });

                return defer.promise;
            }
        };
    });
