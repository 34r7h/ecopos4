angular.module('ecoposApp').factory('imports',function($q, syncData, system){
    var data = {active:{}};

    var api = {
        loadConfigs: function(){
            data.config = syncData('import/config');
        },

        import: function(){
            data.errors = [];
            if(!data.active.configID || !data.config || !data.config[data.active.configID]){
                data.errors.push('Please select an import configuration');
            }
            else{
                var importConfig = data.config[data.active.configID];
                if(!data.active.sourceFile){
                    data.errors.push('Please select a source file for import');
                }
                if((!data.active.importKey || !importConfig.keys || !importConfig.keys[data.active.importKey]) && !data.active.importKeyValue){
                    data.errors.push('Please select a '+importConfig.keyFieldName);
                }

                if(!data.errors.length){
                    api.assertImportKey(importConfig).then(function(importKey){
                        if(!angular.isArray(data.active.sourceFile)){
                            api.importFile(data.active.configID, importKey, data.active.sourceFile);
                        }
                        else{
                            angular.forEach(data.active.sourceFile, function(cFile, cFileNum){
                                api.importFile(data.active.configID, importKey, cFile);
                            });
                        }
                    });
                }
            }
        },

        assertImportKey: function(importConfig){
            var defer = $q.defer();
            if(data.active.importKeyValue){
                var importKeyPath = 'import/config/'+data.active.configID+'/keys/';
                system.api.fbSafePath(importKeyPath+system.api.fbSafeKey(data.active.importKeyValue)).then(function(safeImportKeyPath){
                    data.active.importKey = safeImportKeyPath.replace(importKeyPath, '');
                    if(!importConfig.keys){
                        importConfig.keys = {};
                    }
                    importConfig.keys[data.active.importKey] = {value: data.active.importKeyValue};
                    data.config.$child(data.active.configID+'/keys/'+data.active.importKey).$update(importConfig.keys[data.active.importKey]).then(function(){
                        data.active.importKeyValue = '';
                        defer.resolve(data.active.importKey);
                    });

                });
            }
            if(data.active.importKey){
                defer.resolve(data.active.importKey);
            }
            return defer.promise;
        },

        importFile: function(importConfigID, importKey, fileDef){
            switch(fileDef.type){
                case 'text/csv':
                    api.importCSV(importConfigID, importKey, fileDef);
                    break;
                default:
                    data.errors = ['Unrecognized source file format: \''+fileDef.type+'\''];
                    break;
            }
        },

        importCSV: function(importConfigID, importKey, csvFile){
            var importConfig = importConfigID?data.config[importConfigID]:null;
            if(importConfig && importKey && angular.isDefined(window.FileReader)){
                console.log('csv import \''+importConfig.name+'\' ('+importConfigID+') from \''+csvFile.name+'\' to \''+importConfig.keys[importKey].value+'\' ('+importKey+')');
                var importXref = syncData('import/data-index/'+importConfigID+'/'+importKey);
                var importTarget = syncData(importConfig.target);
                var fileReader = new FileReader();
                fileReader.readAsText(csvFile);
                fileReader.onloadend = function(event){
                    if(event.srcElement.result){
                        var csvDataStr = event.srcElement.result;
                        if(csvDataStr){
                            var csvData = api.csvToArray(csvDataStr);
                            console.log('loaded '+csvData.length+' rows in \''+csvFile.name+'\'');
                            var columnDef = null;
                            var cGroup = [];
                            // parse the csv data
                            angular.forEach(csvData, function(lineData, lineNumber){
                                if(columnDef){
                                    // columns are defined, handle the row as data
                                    if(lineData.length){
                                        var rowGroupCheck = lineData.slice(1).join('').trim();
                                        if(!rowGroupCheck){
                                            // handle row group title
                                            // if there is data in only the first column, treat it as a row group (ie. category)
                                            // >= 76 characters are information/notes rows
                                            if(lineData[0].trim() && lineData[0].length < 76){
                                                if(lineData[0] === lineData[0].toUpperCase()){
                                                    // if it is all-caps, treat as a sub-group
                                                    if(cGroup && cGroup.length > 1){
                                                        cGroup.pop(); // only allowing 1 sub-group
                                                    }
                                                    cGroup.push(lineData[0].trim());
                                                }
                                                else{
                                                    cGroup = [lineData[0].trim()];
                                                }
                                            }
                                        }
                                        else{
                                            // handle a data row
                                            var cRow = {};
                                            angular.forEach(columnDef, function(colIdx, fieldName){
                                                if(colIdx === private.RGSTR){
                                                    // handle special field ROWGROUP
                                                    if(cGroup.length){
                                                        cRow[fieldName] = cGroup.join('/');
                                                    }
                                                }
                                                else if(!angular.isNumber(colIdx)){
                                                    // handle composite fields
                                                    var compParts = colIdx.match(/ROWGROUP|\d+|\D/g);
                                                    if(compParts && compParts.length){
                                                        var cCompData = '';
                                                        angular.forEach(compParts, function(partCol,partIdx){
                                                            if(partCol === private.RGSTR){
                                                                if(cGroup.length){
                                                                    cCompData += cGroup.join('/');
                                                                }
                                                            }
                                                            else{
                                                                var partColNum = parseInt(partCol);
                                                                if(angular.isNumber(partColNum) && !isNaN(partColNum) && partColNum < lineData.length){
                                                                    cCompData += lineData[partColNum];
                                                                }
                                                                else{
                                                                    cCompData += partCol;
                                                                }
                                                            }
                                                        });
                                                        if(cCompData){
                                                            cRow[fieldName] = cCompData.trim();
                                                        }
                                                    }

                                                }
                                                else if(colIdx < lineData.length){
                                                    // normal field definition
                                                    cRow[fieldName] = lineData[colIdx].trim();
                                                }
                                            });
                                            if (Object.keys(cRow).length && cRow.id) {
                                                // the row has data, save it
                                                var cRowID = system.api.fbSafeKey(cRow.id);

                                                var newTargetRow = cRow;
                                                delete newTargetRow.id;
                                                // ecodocs: set up the rest of the target data...

                                                var targetID = importXref[cRowID] ? importXref[cRowID] : null;
                                                if(targetID && !importTarget[targetID]){
                                                    console.log('line #'+lineNumber+': what is #'+cRowID+'->'+targetID);
                                                }
                                                if (!targetID || !importTarget[targetID]) {
                                                    // new target
                                                    if(lineNumber % 10 === 0){
                                                        console.log('line #'+lineNumber+': *NEW* ' + cRowID);
                                                    }

                                                    importTarget.$add(newTargetRow).then(function (newTarget) {
                                                        targetID = newTarget.name();
                                                        importXref.$child(cRowID).$set(targetID);
                                                    });
                                                }
                                                else {
                                                    // updating existing target
                                                    // ecodocs: we can compare the data here to see what is different
                                                    if(lineNumber % 10 === 0) {
                                                        console.log('line #' + lineNumber + ': *UPDATE* ' + cRowID + '->' + targetID);
                                                    }
                                                    //console.log('updating:' + cRowID + '->' + targetID + ' with line #' + lineNumber);
                                                    importTarget.$child(targetID).$update(newTargetRow);
                                                }
                                            }
                                            else {
                                                console.log('No id found for row #' + lineNumber);
                                            }
                                        }
                                    }
                                }
                                else if(lineNumber < 25){
                                    // no column definitions yet, check if this row can be used to define them
                                    // if no column definition found in first 25 lines, it is an error

                                    var cColumnDef = {};
                                    angular.forEach(importConfig.fields, function(cFieldCheck, cFieldID){
                                        var cColDef = '';
                                        angular.forEach(cFieldCheck, function(fieldMatch, fieldMatchIdx){
                                            if(cColDef === ''){
                                                cColDef = private.parseColumnNumber(fieldMatch, lineData);
                                            }
                                        });

                                        if(cColDef !== ''){
                                            cColumnDef[cFieldID] = cColDef;
                                        }
                                    });

                                    if(Object.keys(cColumnDef).length && angular.isDefined(cColumnDef.id)){
                                        console.log('Columns defined:'+JSON.stringify(cColumnDef));
                                        columnDef = cColumnDef;
                                    }
                                }
                                else{
                                    data.errors.push('No column definition found in provided CSV');
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

    var private = {
        RGSTR: 'ROWGROUP', // string to substitute with specialty ROWGROUP

        parseColumnNumber: function(columnName, inLineData){
            var result = '';
            var compCheck = columnName.split(/\+'|'\+/);
            if(compCheck.length > 1){
                // composite field
                var compRes = '';
                var compFail = false;
                // look for each component's column index
                angular.forEach(compCheck, function(comp, compIdx){
                    if(!compFail){
                        if(compIdx % 2 === 0){
                            // component column - look it up
                            if(comp === private.RGSTR){
                                compRes += comp;
                            }
                            else{
                                var nextColCheck = comp.match(/_+$/);
                                var nextColAdd = 0;
                                if(nextColCheck && nextColCheck.length){
                                    nextColAdd = nextColCheck[0].length;
                                    comp = comp.substr(0, comp.length-nextColAdd);
                                }

                                var colIdx = inLineData.indexOf(comp);
                                if(colIdx !== -1){
                                    compRes += (colIdx+nextColAdd);
                                }
                                else{
                                    compFail = true;
                                }
                            }
                        }
                        else{
                            // separator character
                            compRes += comp;
                        }
                    }
                });
                if(!compFail){
                    result = compRes;
                }
            }
            else{
                // normal field - look for this column
                if(compCheck[0] === private.RGSTR){
                    result = compCheck[0];
                }
                else{
                    var nextColCheck = compCheck[0].match(/_+$/);
                    var nextColAdd = 0;
                    if(nextColCheck && nextColCheck.length){
                        nextColAdd = nextColCheck[0].length;
                        compCheck[0] = compCheck[0].substr(0, compCheck[0].length-nextColAdd);
                    }
                    var colIdx = inLineData.indexOf(compCheck[0]);
                    if(colIdx !== -1){
                        result = colIdx+nextColAdd;
                    }
                }
            }
            return result;
        }
    };


    var imports = {
        api: api,
        data: data
    };
    return imports;
});