Ecopos Dev v.472
================
This blasphemously stable build is from 3 generators: cg-angular, angular, and angularfire.
Slight differences include utilizing multiple named $state views and new-found freedom of file placements which is grouped more by view.
----
* Resolve somewhat works...

Refs? (syncData) {}
----
#### syncData('widgets/alpha').$bind($scope, 'widget');
Provides a 3-way binded ref

#### $scope.db-suffix = syncData('db-suffix', limit);
Provides a traditional ref


run -> 'grunt server'
build -> 'grunt build'

* scripts/ contains angularfire login controllers and helper services
* file structure more closely matches site navigation
* reusable views, controlled by $state view controllers, etc.

