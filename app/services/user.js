angular.module('ecoposApp').factory('user',function($log, $q, $firebaseSimpleLogin, firebaseRef, syncData, md5){
    var data = {
        profile: null,
        errors: []
    };

    var api = {
        init: function(){
            api.login('active');
        },

        login: function(provider){
            api.resetErrors();
            var auth = private.assertAuth();

            // callback for all login methods
            function userAuthenticated(user){
                if(user){
                    private.loadProfile(user).then(function(profile){
                            $log.debug(profile.$id+' logged in!');
                        },
                        function(err){
                            data.errors.push(err);
                            auth.$logout();
                        }
                    );
                }
            }

            // handle login request based on provider
            switch(provider){
                case 'active':
                    auth.$getCurrentUser().then(userAuthenticated);
                    break;

                case 'password':
                    if(!data.login || !data.login.email || !data.login.password){
                        data.errors = ['Please enter your email address and password to login'];
                    }
                    else{
                        auth.$login('password', {
                            email: data.login.email,
                            password: data.login.password,
                            rememberMe: true
                        }).then(userAuthenticated,
                            function(err){
                                data.errors = ['Invalid username or password'];
                            }
                        );
                    }

                    break;

                case 'facebook':
                case 'twitter':
                    auth.$login(provider, {rememberMe: true}).then(userAuthenticated,
                        function(err){
                            data.errors.push(err);
                        }
                    );
                    break;
            }
        },

        logout: function(){
            api.resetErrors();
            var auth = private.assertAuth();
            if(auth.user){
                auth.$logout();
            }
            data.profile = null;
        },

        register: function(){
            api.resetErrors();
            if(data.profile){
                // email address is always required
                if(!data.profile.email){
                    // ecodocs: add more email validation
                    data.errors.push('Please enter an email address');
                }

                if(data.profile.uid){
                    // registering from a 3rd party
                    if(!data.profile.username){
                        data.errors.push('Please enter a username');
                    }
                }
                else{
                    // registering new email/password account
                    // ecodocs: need to fix this for 2-step: 1. create account. 2. create profile
                    if(!data.profile.password){
                        data.errors.push('Please enter a password');
                    }
                    else if(data.profile.password.length < 6){
                        data.errors.push('Password is too short (minimum 6 characters)');
                    }
                    else if(data.profile.passConfirm !== data.profile.password){
                        data.errors.push('Passwords do not match');
                    }
                }

                if(!data.errors.length){
                    // no errors, do the registration
                    if(!data.profile.username){
                        data.profile.username = data.profile.email.split('@', 2)[0];
                    }

                    var defer = $q.defer();

                    var hashCore = {UN:{key: data.profile.username, value: data.profile.email}, UE: {key: data.profile.email, value: data.profile.uid}};
                    // first check if the UN (username) and UE (email) hashes are available
                    private.reserveHash(hashCore).then(
                        function(success){
                            var accountExists = $q.defer();

                            // create the account if needed
                            if(!data.profile.uid){
                                var auth = private.assertAuth();
                                auth.$createUser(data.profile.email, data.profile.password).then(function(account){
                                        data.profile.uid = account.uid;
                                        hashCore['UE'].value = data.profile.uid;
                                        auth.$login('password', {
                                            email: data.profile.email,
                                            password: data.profile.password,
                                            rememberMe: true
                                        }).then(function(user){
                                                accountExists.resolve(user.uid);
                                            },
                                            function(err){
                                                // created, but failed login
                                                accountExists.reject(err);
                                            }
                                        );
                                },
                                function(err){
                                    // failed creation
                                    accountExists.reject(err);
                                });
                            }
                            else{
                                // already authenticated
                                accountExists.resolve(data.profile.uid);
                            }

                            accountExists.promise.then(function(uid){
                                    // username and email hash available and currently un-claimed
                                    // add the uid hash and claim them all!  hash <3!
                                    hashCore.UP = {key: data.profile.uid, value: data.profile.username};
                                    private.reserveHash(hashCore, true).then(
                                        function(success){
                                            // all hashes are claimed, build the user
                                            var userProfile = syncData('user/'+data.profile.username);
                                            var linkAccounts = {};
                                            linkAccounts[data.profile.uid] = true;
                                            var roles = {admin: false, customer: true, employee: false, manager: false, supplier: false};
                                            userProfile.$set({
                                                email: data.profile.email,
                                                displayName: data.profile.displayName?data.profile.displayName:data.profile.username,
                                                linkedAccount: linkAccounts,
                                                roles: roles
                                            }).then(function(){
                                                    // user profile saved
                                                    defer.resolve(userProfile);
                                                },
                                                function(err){
                                                    // failed saving user profile
                                                    defer.reject([err]);
                                                }
                                            );
                                        },
                                        function(err){
                                            // could not claim hashes
                                            defer.reject(err);
                                        }
                                    );
                                },
                                function(err){
                                    // account doesn't exist or failed creating
                                    defer.reject([err]);
                                }
                            );

                        },
                        function(err){
                            // hashes in use
                            defer.reject(err);
                        }
                    );

                    // finished writing new profile
                    defer.promise.then(function(profile){
                            data.profile = profile;
                            $log.debug('Profile created!');
                            // ecodocs: write to roles table
                        },
                        function(err){
                            data.errors = err;
                        }
                    );

                }
            }
            else{
                data.errors = ['No profile data set.'];
            }
        },

        resetErrors: function(){
            data.errors=[];
        }

    };

    var private = {
        data: {
            auth: null
        },

        assertAuth: function(){
            if(!private.data.auth){
                private.data.auth = $firebaseSimpleLogin(firebaseRef());
            }
            return private.data.auth;
        },

        loadProfile: function(user){
            var defer = $q.defer();
            if(angular.isDefined(user.uid)){
                // check if there is a username associated with given uid
                firebaseRef('hash/UP/'+user.uid).on('value', function(snap){
                        var username = snap.val();
                        if(username){
                            // user exists, bind up the profile
                            var profile = syncData('user/'+username);
                            profile.$on('loaded', function(){
                                data.profile = profile;
                                defer.resolve(data.profile);
                            });
                        }
                        else{
                            // new user
                            data.profile = {
                                new: true,
                                uid: user.uid,
                                displayName: user.displayName

                            };
                            // initialize new profile with whatever data is available from 3rd party provider
                            if(user.thirdPartyUserData){
                                data.profile.username = user.thirdPartyUserData.username;
                                if(!data.profile.username){
                                    data.profile.username = user.thirdPartyUserData.screen_name;
                                }
                                data.profile.email = user.thirdPartyUserData.email;
                            }
                            defer.resolve(data.profile);
                        }
                    },
                    function(err){
                        defer.reject('User lookup failed');
                    }
                );
            }
            else{
                // user object is not properly authenticated with firebase
                defer.reject('Unauthenticated user');
            }

            return defer.promise;
        },

        reserveHash: function(hashReq, claimHash){
            // promise that this hashReq is reserved for the authenticated user
            // resolves true if all requested hashes are reserved
            // rejects hashReq key name as error value on first failed hash
            var defer = $q.defer();

            var promises = [];
            angular.forEach(hashReq, function(value, key){
                var newP = $q.defer();
                promises.push(newP.promise);

                var hashPath = 'hash/'+key+'/'+((key==='UP')?value.key:md5.createHash(value.key));
                var hashVal = ((key==='UP' || !value.value)?value.value:md5.createHash(value.value));
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
                    var errors = [];
                    if(!angular.isArray(err)){
                        err = [err];
                    }
                    angular.forEach(err, function(errorKey){
                        switch(errorKey){
                            case 'UE':
                                errors.push('Email address is in use');
                                break;
                            case 'UN':
                                errors.push('Username is in use');
                                break;
                            case 'UP':
                                errors.push('Account is in use');
                                break;
                        }
                    });
                    defer.reject(errors);
                }
            );

            return defer.promise;
        }
    };

    var user = {
        api: api,
        data: data
    };
    return user;
});