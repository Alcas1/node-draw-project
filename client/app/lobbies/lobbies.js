'use strict';

angular.module('nodedrawApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('lobbies', {
        url: '/lobbies',
        templateUrl: 'app/lobbies/lobbies.html',
        controller: 'LobbiesCtrl'
      });
  });