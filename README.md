Ecopos Dev v.472
================
This blasphemously stable build is from 3 generators: cg-angular, angular, and angularfire.
Slight differences include utilizing multiple named $state views and new-found freedom of file placements which is grouped more by view.
----
* Resolve somewhat works...

FB Refs
=================

function(syncData) {
#### syncData('widgets/alpha').$bind($scope, 'widget');
    Provides a 3-way binded ref
#### $scope.db-suffix = syncData('db-suffix', limit);
    Provides a traditional ref
}

Usage
=================

##### 'grunt server'
    run server on 9001
##### 'grunt build'
    builds to /dist
##### 'yo cg-angular:...' -> 'partial, directive, service, or filter'.
    Subgenerators now allow choice of file placement. Small bug on directives, the resulting js may not reference the correct location if you chose a custom path. Quickfix.

Notes
-----------------

* scripts/ contains angularfire login controllers and helper services
* file structure more closely matches site navigation
* reusable views, controlled by $state view controllers, etc.

