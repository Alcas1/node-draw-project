'use strict';

angular.module('nodedrawApp')
.controller('RightbarCtrl', function ($scope, $location, Auth) {
  var socketio = io('', {
    path: '/socket.io-client'
  });

  $scope.state=0;
  $scope.lobbies=[];
  var allLobbies;
  var lobbyName="Lobby";
  var curLobby;
  $scope.players=[];
  
  socketio.on('lobbyName',function(lobby){
    $scope.lobbyName=lobby;
    $scope.$apply();
    curLobby=lobby;
  });
  if($location.path()==='/')
  {
    $scope.state=0;
    $scope.listName='Current Lobbies';
    socketio.emit('getLobbyList',true);
    socketio.on('updateLobbyList',function(lobbies){
      allLobbies=lobbies;
      $scope.listItems=lobbies;
      $scope.$apply();
    });
  }
  if($location.path()==='/game')
  {
    $scope.state=1;
    $scope.listName='Players';
    socketio.emit('getRoom');
    socketio.on('updateRoom',function(lobby){
      curLobby=lobby;
      $scope.lobbyName=lobby.name;
      $scope.listItems=lobby.users;
      $scope.$apply();
    });

  }


  
  $scope.goToLobby = function(lobby){
    socketio.emit('getLobbyList');
    if(!(lobby.status==='#f44336'))
    {
      socketio.emit('leave');
      socketio.emit('getRoom');
      socketio.emit('join',lobby.name);
      socketio.emit('getRoom');
      $location.path('/game');
    } 
  };

  $scope.search = '';
  var regex;
  $scope.$watch('search', function (value) {
    regex = new RegExp('\\b' + escapeRegExp(value), 'i');
  });

  $scope.filterBySearch = function(name) {
    if (!$scope.search) return true;
    return regex.test(name.name);
  };



});

      function escapeRegExp(string){
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      }