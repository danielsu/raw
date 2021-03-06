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
            }
        }
    });
