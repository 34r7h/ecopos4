(function (angular) {

	angular.module('ecoposApp')
		.run(function ($injector, $rootScope, loginRedirectState) {
			if ($injector.has('$state')) {
				new RouteSecurityManager($rootScope, $injector.get('$state'), loginRedirectState);
			}
		});

	function RouteSecurityManager($rootScope, $state, loginState) {
		this._state = $state;
    this._rootState = 'main';
		this._rootScope = $rootScope;
    this._loginState = loginState;
		this._redirectTo = null;
		this._authenticated = !!($rootScope.auth && $rootScope.auth.user);
		this._init();
	}

	RouteSecurityManager.prototype = {
		_init: function () {
			var self = this;
			this._checkCurrent();

			// Set up a handler for all future route changes, so we can check
			// if authentication is required.
			self._rootScope.$on('$stateChangeStart', function (event, toState) {
				self._authRequiredRedirect(event, toState, self._loginState, self._loginPath);
			});

			//self._rootScope.$on('$firebaseSimpleLogin:login', angular.bind(this, this._login));
      self._rootScope.$on('ecopos:user:bound', angular.bind(this, this._login));
			self._rootScope.$on('$firebaseSimpleLogin:logout', angular.bind(this, this._logout));
			self._rootScope.$on('$firebaseSimpleLogin:error', angular.bind(this, this._logout));
		},

		_checkCurrent: function () {
			// Check if the current page requires authentication.
			if (this._state.current) {
				this._authRequiredRedirect(null, this._state.current, this._loginState, this._loginPath);
			}
		},

		_login: function () {
			this._authenticated = true;
			if (this._redirectTo) {
				this._redirect(this._redirectTo);
				this._redirectTo = null;
			}
      else if(this._state.current && this._state.current.name === this._loginState){
          this._redirect(this._rootState);
      }
		},

		_logout: function () {
			this._authenticated = false;
			this._checkCurrent();
		},

		_redirect: function (stateName) {
        this._state.go(stateName, null, {location: 'replace'});
		},

		// A function to check whether the current path requires authentication,
		// and if so, whether a redirect to a login page is needed.
		_authRequiredRedirect: function (event, state, loginState, path) {
            if(state.authRequired && !this._authenticated){
                this._redirectTo = state.name;
                if(event && typeof event.preventDefault === 'function'){
                  // stop loading the requested state
                  event.preventDefault();
                }
                this._redirect(loginState);
            }
		}
	};
})(angular);