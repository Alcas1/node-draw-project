'use strict';

angular.module('nodedrawApp')
  .controller('LobbiesCtrl', function ($scope, $http, $location,socket) {

    $scope.lobbies=[];
    var allLobbies;
	var socketio = socket.socket;
    socketio.emit('getLobbyList',true);
    socketio.on('updateLobbyList',function(lobbies){
    	allLobbies=lobbies;
    	$scope.lobbies=allLobbies;
    	$scope.$apply();
    });
    $scope.goToLobby = function(lobby){
    	socketio.emit('leave');
    	socketio.emit('getRoom');
    	socketio.emit('join',lobby.name);
    	socketio.emit('getRoom');
    	$location.path('/game');
    };

  });
