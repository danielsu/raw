'use strict';

/* Services */

angular.module('raw.services', [])

    .factory('dataService', function ($http, $q, $timeout) {
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
                const PROXY_SERVER = "http://0.0.0.0:8180/?proxy=";
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
            getMetaDataFromJson: getMetaDataFromJson

        }
    });
