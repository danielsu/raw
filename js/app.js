'use strict';

angular.module('raw', [
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'raw.filters',
  'raw.services',
  'raw.directives',
  'raw.controllers',
  'mgcrea.ngStrap',
  'ui',
  'colorpicker.module',
  'isteven-multi-select',
  'ds-angular-nested-json-to-table'
])

.config(['$routeProvider','$locationProvider', function ($routeProvider,$locationProvider) {
  $routeProvider.when('/', {templateUrl: 'partials/main.html', controller: 'RawCtrl'});
  $routeProvider.otherwise({redirectTo: '/'});
  $locationProvider.html5Mode(true);
}]);