'use strict';

/* Services */

angular.module('raw.services', [])

    .factory('dataService', function ($http, $q, $timeout) {
        var storageObject = {};

        // there are basic type check available
        // raw just improves date check to only accept certain input
        function typeOfAngularStyle(value) {
            if (value === null || value.length === 0) return null;
            if (angular.isDate(value)) return Date.name;
            if (angular.isNumber(value)) return Number.name;
            if (angular.isString(value)) return String.name;
            if (angular.isArray(value)) return Array.name;
            if (angular.isObject(value)) return Object.name;
        }

        /**
         * Flattens attribute names and their type.
         * Concats nested attributes via '.'
         * e.g. {"purchaseDate": 1478931416146, [ "articles": [ {"name": "Wintermantel",}]}
         * will be returned as:
         * [
         *   {key: "purchaseDate", type: "Number"},
         *   {key: "articles.name", type: "String"}
         * ]
         *
         * Disclaimer: Only the first item of each array will be inspected.
         *
         * @param json required
         * @param prefix optional, used for nested calls
         * @return {Array} resulting metadata
         */
        function getMetaDataFromJson(json, prefix) {
            if (!json) {
                return [];
            }
            var keyPrefix = prefix ? prefix + '.' : '';
            var resultList = [];
            var nestedResult;

            // for now, only inspect first entry in array, assuming all have the same attributes
            var firstEntry = json[0];
            var propertyNames = Object.getOwnPropertyNames(firstEntry);
            propertyNames.forEach(function (propName) {
                var valueOfProperty = firstEntry[propName];
                var item = {};
                item.key = keyPrefix + propName;
                item.type = typeOfAngularStyle(valueOfProperty);

                if (item.type === Array.name) {
                    nestedResult = getMetaDataFromJson(valueOfProperty, item.key);
                    resultList = resultList.concat(nestedResult);
                }
                else {
                    resultList.push(item)
                }
            });

            return resultList;
        }

        return {

            loadSample: function (sample) {
                var deferred = $q.defer();
                $http.get(sample)
                    .then(function (response) {
                        deferred.resolve(response.data);
                    },
                    function () {
                        deferred.reject("An error occured while getting sample (" + sample.title + ")");
                    });

                return deferred.promise;
            },

            debounce: function (func, wait, immediate) {
                var timeout;
                var deferred = $q.defer();
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate) {
                            deferred.resolve(func.apply(context, args));
                            deferred = $q.defer();
                        }
                    };
                    var callNow = immediate && !timeout;
                    if (timeout) {
                        $timeout.cancel(timeout);
                    }
                    timeout = $timeout(later, wait);
                    if (callNow) {
                        deferred.resolve(func.apply(context, args));
                        deferred = $q.defer();
                    }
                    return deferred.promise;
                };
            },

            /**
             * Get data via Proxy Server to circumvent Same Origin Policy / CORS of external servers.
             * @param url
             */
            loadExternalData: function (url) {
                var deferred = $q.defer();
                var PROXY_SERVER = "http://0.0.0.0:8180/?proxy=";
                $http.get(PROXY_SERVER + url)
                    .then(function (response) {
                        deferred.resolve(response.data);
                    },
                    function () {
                        deferred.reject("An error occured while getting url (" + url + ")");
                    });

                return deferred.promise;
            },

            /**
             *
             * @param json required
             * @param prefix optional, used for nested calls
             * @return {Array} resulting metadata
             */
            getMetaDataFromJson: getMetaDataFromJson,

            /**
             * Transform nested Data set to object relational mapping
             * @param inputList
             * @return {{TopLevel: Array}}
             */
            transformNestedDataToORM: function (inputList) {
                var resultStorage = {
                    TopLevel: []
                };

                //iterate inputList = top level
                inputList.forEach(function (item, topLevelIndex) {
                    if (!resultStorage.TopLevel[topLevelIndex]) {
                        resultStorage.TopLevel.push({});
                    }
                    // add simple props and objects, but no arrays
                    var itemPropertyNames = Object.getOwnPropertyNames(item); // indirect call for array items needed

                    itemPropertyNames.forEach(function (name) {
                        if (angular.isArray(item[name])) {
                            // handle array
                            if (!resultStorage[name]) {
                                resultStorage[name] = [];
                            }

                            var array = item[name];
                            array.forEach(function (arrayItem) {
                                // TODO is creating var in loop performance issue? otherwise, how to avoid reference to other objects
                                var tempModifiedItem = angular.copy(arrayItem);
                                tempModifiedItem.refIndex = topLevelIndex;
                                tempModifiedItem.refName = "TopLevel";
                                resultStorage[name].push(tempModifiedItem);
                            })

                        } else {
                            resultStorage.TopLevel[topLevelIndex][name] = angular.copy(item[name]);
                        }
                    });
                });
                storageObject = resultStorage;
                return resultStorage;
            },

            /**
             * Combines a result set with given properties from multiple data sets (tables, ORM)
             * @get selected param inputORMData
             * @param selectedProperties
             * @return {Array}
             */
            getItemsWithSelectedProperties: function (inputORMData, selectedProperties) {
                var result = [];

                if (!inputORMData || inputORMData.length === 0) {
                    console.error('no inputORMData data given');
                    return [];
                }

                // check for nested properties / arrays
                // e.g. "articles.pricePerPiece", "articles.category"
                var nestedPropList = selectedProperties.filter(function (propertyName) {
                    // indirect call for array items needed
                    return String.prototype.contains.call(propertyName, ".")
                });

                // extract number of arrays
                // e.g. articles.pricePerPiece --> 'articles'
                var singleArrayName = "";
                var hasError = false;
                nestedPropList.forEach(function (name) {
                    // get first part
                    var firstPart = name.split('.')[0];

                    if (singleArrayName === firstPart || singleArrayName.length === 0) {
                        singleArrayName = firstPart;
                    } else {
                        console.error('Can not handle sets with multiple arrays. Already use:', singleArrayName, 'ignore array:', firstPart);
                        // cannot break forEach... handle outside
                        hasError = true;
                    }
                });

                if (hasError) {
                    return [];
                }

                if (nestedPropList.length === 0) {
                    // handle case, when only outer data is selected
                    //iterate over top level
                    inputORMData.TopLevel.forEach(function (item) {
                        var newEntry = {};
                        selectedProperties.forEach(function (propName) {
                            newEntry[propName] = item[propName]
                        });
                        result.push(newEntry);
                    });

                } else {
                    // iterate over nested array and fill with surrounding parent data
                    inputORMData[singleArrayName].forEach(function (innerItem) {
                        var newEntry = {};
                        // get all selected array values
                        // e.g. "articles.pricePerPiece", "articles.category"
                        selectedProperties.forEach(function (propName) {
                            if (propName.startsWith(singleArrayName + ".")) {
                                // add property of this array item
                                newEntry[propName] = innerItem[propName.split('.')[1]];

                            } else if (!String.prototype.contains.call(propName, ".")) {
                                // indirect call of "contains" for array items needed
                                // parent data: e.g. "zipCode": "80331", "city": "München"

                                // TODO performance killer ? due to look up for each property
                                var parent = inputORMData[innerItem.refName][innerItem.refIndex];
                                newEntry[propName] = parent[propName];
                            } else {
                                console.error('Skip property of multiple array:', propName);
                            }
                        });
                        result.push(newEntry);
                    });
                }
                return result;
            },
            getStorageObject: function () {
                return storageObject;
            }
        }
    });
