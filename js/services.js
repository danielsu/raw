'use strict';

/* Services */

angular.module('raw.services', [])

    .factory('dataService', function ($http, $q, $timeout) {

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

            getMetaDataFromJson: function (json) {
                if(!json){
                    return [];
                }

                // TODO typen werden komplexer und verschachtelt
                // TODO check iteratively for nested objects
                // key & type
                var firstEntry = json[0];
                var propertyNames = Object.getOwnPropertyNames(firstEntry);
                var resultList = [];
                propertyNames.forEach(function (propName) {
                    var item = {};
                    item.key = propName;
                    item.type = typeOfAngularStyle(firstEntry[propName]);
                    resultList.push(item)
                });

                // TODO mention, that there are basic type check available
                // raw just improves date check to only accept certain input
                function typeOfAngularStyle(value) {
                    if (value === null || value.length === 0) return null;
                    if (angular.isDate(value)) return Date.name;
                    if (angular.isNumber(value)) return Number.name;
                    if (angular.isString(value)) return String.name;
                    if (angular.isArray(value)) return Array.name;
                }

                return resultList;
            }


        }
    });
