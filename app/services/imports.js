angular.module('ecoposApp').factory('imports',function(syncData){
    var data = {active:{}};

    var api = {
        loadConfigs: function(){
            data.config = syncData('imports/config');
        },

        import: function(){
            data.errors = [];
            if(!data.active.configID || !data.config || !data.config[data.active.configID]){
                data.errors.push('Please select an import configuration');
            }
            if(!data.active.sourceFile){
                data.errors.push('Please select a source file for import');
            }

            if(!data.errors.length){
                var importConfig = data.config[data.active.configID];
                console.log('importing \''+importConfig.name+'\' from '+JSON.stringify(data.active.sourceFile));

                if(!angular.isArray(data.active.sourceFile)){
                    api.importFile(importConfig, data.active.sourceFile);
                }
                else{
                    angular.forEach(data.active.sourceFile, function(cFile, cFileNum){
                        api.importFile(importConfig, cFile);
                    });
                }
            }

        },

        importFile: function(importConfig, fileDef){
            switch(fileDef.type){
                case 'text/csv':
                    api.importCSV(importConfig, fileDef);
                    break;
                default:
                    data.errors = ['Unrecognized source file format: \''+fileDef.type+'\''];
                    break;
            }
        },

        importCSV: function(importConfig, csvFile){
            if(angular.isDefined(window.FileReader)){
                console.log('csv import \''+importConfig.name+'\' from \''+csvFile.name+'\'');
                var fileReader = new FileReader();
                fileReader.readAsText(csvFile);
                fileReader.onloadend = function(event){
                    if(event.srcElement.result){
                        var csvDataStr = event.srcElement.result;
                        if(csvDataStr){
                            var csvData = api.csvToArray(csvDataStr);
                            console.log('loadend:'+event.loaded+'/'+event.total+':'+csvData.length+' rows');
                            var columnDef = null;
                            // parse the csv data
                            angular.forEach(csvData, function(line, lineNumber){
                                if(!columnDef){
                                    // no columns defined, check if this row can be used to define them
                                    var emptyCount = 0;
                                    angular.forEach(line, function(cCol, cColIdx){
                                        if(cCol === ''){
                                            emptyCount++;
                                        }
                                    });
                                    // column definition is first row with <= 2 empty fields
                                    if(emptyCount <= 2){
                                        columnDef = line;
                                        console.log('COLUMNS:'+JSON.stringify(columnDef));

                                        // cross reference the detected columns with the import config
                                        //columnDef = {};


                                    }
                                }
                                else{
                                    // columns are defined, handle the row as data
                                    var cRow = {};
                                    angular.forEach(columnDef, function(colName, colNum){
                                        if(colNum < line.length){
                                            cRow[colName] = line[colNum];
                                        }
                                    });
                                    console.log('['+lineNumber+']='+line.length+((lineNumber % 10 === 0)?':'+JSON.stringify(cRow):''));
                                }

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