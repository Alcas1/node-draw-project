'use strict';

angular.module('nodedrawApp')
.controller('MainCtrl', function ($scope, $http, $location, Auth, User, socket) {
  var socketio=socket.socket;
  $scope.lobbies = [];
  $scope.errors={};
  //$scope.numUsers='Players Online Now:  ';
  socketio.emit('getUserNum');
  socketio.emit('getLobbyList',true);
  socketio.on('updateLobbyList',function(nLobbies){
    $scope.lobbies=nLobbies;
    $scope.$apply();
  });

  $scope.createLobby = function(form) {
    $scope.submitted = true;
    if(form.$valid) {
      var isCreated=false;
      for(var i=0;i<$scope.lobbies.length;i++)
      {
        if(($scope.lobbyName)===($scope.lobbies[i].name))
        { 
          $scope.errors.other='A Lobby with that name has already been created!'
          return;
        }
      }

      socketio.emit('leave');
      socketio.emit('getRoom');
      socketio.emit('createLobby', {lobbyName:$scope.lobbyName,lobbyPlayerNum:$scope.lobbyPlayerNum,code:$scope.code});
      socketio.emit('getRoom');
      var newLobbyName='#'+$scope.lobbyName;
      $location.path('/game').search({lobby:newLobbyName});
      $scope.lobbyName = '';
      $scope.lobbyPlayerNum = '';
      $scope.code = '';
    }

  };

  $scope.findLobby = function(){
    $location.path('/lobbies');
  };

  $scope.deleteThing = function(thing) {
    $http.delete('/api/lobbys/' + thing._id);
  };

  $scope.$on('$destroy', function () {
    // socket.unsyncUpdates('lobby');
    socketio.removeAllListeners();
  });

  socketio.on('connect', function(){
    if(Auth.isLoggedIn())
    {
      $scope.getCurrentUser=User.get();
      $scope.getCurrentUser.$promise.then(function(data) {
        socketio.emit('updateUser',data);
      });
    }
    else{
      var curUser ={
        name: "Guest "+this.id.substring(0,5),
        email: "",
        role: "user",
        tempScore:0,
        totalScore:0,
        provider: "local",
        status:0
      };
      socketio.emit('updateUser',curUser);
    }

  });
  socketio.on('userCountChange', function(numUsers){
    $scope.numUsers="Players Online Now: "+numUsers;
    $scope.$apply();
  });


});
