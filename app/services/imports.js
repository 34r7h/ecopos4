angular.module('ecoposApp').factory('imports',function(syncData){
    var data = {};

    var api = {
        loadConfigs: function(){
            data.config = syncData('imports/config');
        }
    };

    var imports = {
        api: api,
        data: data
    };
    return imports;
});