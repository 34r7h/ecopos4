angular.module('ecoposApp').factory('imports',function(syncData){
    var data = {};

    var api = {
        loadConfigs: function(){
            data.config = syncData('imports/config');
        },

        import: function(){
            if(data.sourceFile){
                console.log('importing from '+JSON.stringify(data.sourceFile));
                switch(data.sourceFile.type){
                    case 'text/csv':
                        if(!angular.isArray(data.sourceFile)){
                            api.importCSV(data.sourceFile);
                        }
                        break;
                    default:
                        data.errors = ['Unrecognized source file format'];
                        break;
                }
            }
            else{
                data.errors = ['Please select a source file for import'];
            }

        },

        importCSV: function(csvFile){
            if(angular.isDefined(window.FileReader)){
                console.log('csv import from '+csvFile.name);
                var fileReader = new FileReader();
                fileReader.readAsText(csvFile);
                fileReader.onloadend = function(event){
                    if(event.srcElement.result){
                        var csvData = event.srcElement.result;

                        // ecodocs: parse the csvData - it's a string at this point

                        console.log('loadend:'+event.loaded+'/'+event.total);
                    }
                };

            }
            else{
                data.errors = ['Browser does not support file reading'];
            }
        }
    };


    var imports = {
        api: api,
        data: data
    };
    return imports;
});