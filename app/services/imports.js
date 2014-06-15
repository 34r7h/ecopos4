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
                        var csvDataStr = event.srcElement.result;
                        if(csvDataStr){
                            var csvData = api.csvToArray(csvDataStr);
                            console.log('loadend:'+event.loaded+'/'+event.total+':'+csvData.length+' lines');
                            angular.forEach(csvData, function(line, lineNumber){
                                console.log('['+lineNumber+']='+line.length); //+':'+JSON.stringify(line));
                            });
                        }
                    }
                };

            }
            else{
                data.errors = ['Browser does not support file reading'];
            }
        },


        // This will parse a delimited string into an array of
        // arrays. The default delimiter is the comma, but this
        // can be overriden in the second argument.
        // SOURCE: http://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
        csvToArray: function(strData, strDelimiter){
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                    // Standard fields.
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                    ),
                "gi"
            );


            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;

            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec( strData )){
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter){
                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push( [] );
                }

                var strMatchedValue = '';
                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]){
                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[ 2 ].replace(
                        new RegExp( "\"\"", "g" ),
                        "\""
                    );
                } else {
                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[ 3 ];
                }

                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push( strMatchedValue );
            }

            // Return the parsed data.
            return( arrData );
        }
    };


    var imports = {
        api: api,
        data: data
    };
    return imports;
});