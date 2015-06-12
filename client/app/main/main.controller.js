'use strict';

angular.module('nodedrawApp')
  .controller('MainCtrl', function ($scope, $http, $location, socket) {
    $scope.awesomeThings = [];

    $http.get('/api/lobbys').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('lobby', $scope.awesomeThings);
    });

    $scope.createLobby = function() {
      if($scope.lobbyName === '') {
        return;
      }
      $http.post('/api/lobbys', { name: $scope.lobbyName });
      $scope.lobbyName = '';
      $scope.lobbyPlayerNum = '';
      $scope.code = '';
      $location.path('/game');
    };


    $scope.deleteThing = function(thing) {
      $http.delete('/api/lobbys/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('lobby');
    });
  });
