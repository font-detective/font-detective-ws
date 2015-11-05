'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/find', {
      templateUrl: 'partials/find',
      controller: 'MyCtrl1'
    }).
    when('/login', {
      templateUrl: 'partials/login',
      controller: 'MyCtrl2'
    }).
    otherwise({
      redirectTo: '/find'
    });

  $locationProvider.html5Mode(true);
});
