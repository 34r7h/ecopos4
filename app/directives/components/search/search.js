angular.module('ecoposApp').directive('search', function(system) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'app/directives/components/search/search.html',
		link: function(scope, element, attrs, fn) {
            var searchStarted = function(){
                //console.log('search initiated');
            };

            var searchCleared = function(){
                //console.log('search cleared');
            };

            scope.doSearch = function(trigger){
                if(!scope.search.results && scope.search.value){
                    searchStarted();
                }
                if(scope.search.value.length !== 1){
                    system.api.search(scope.search, trigger);
                }
                if(!scope.search.results && !scope.search.value){
                    searchCleared();
                }
            };

		}
	};
});
