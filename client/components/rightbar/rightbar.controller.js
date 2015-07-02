'use strict';

angular.module('nodedrawApp')
.controller('RightbarCtrl', function ($scope, $location, Auth,socket) {
  var socketio = socket.socket;

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
      for(var i=0;i<lobby.users.length;i++)
      {
        console.log(lobby.users[i].status);
        lobby.users[i].statusColor=getStatusColor(lobby.users[i].status);
        lobby.users[i].statusName=getStatusName(lobby.users[i].status);
        if(lobby.adminId===lobby.users[i].userId)
        {
          lobby.users[i].isAdmin=true;
        }
      }
      $scope.listItems=lobby.users;
      $scope.$apply();
    });

  }


  
  $scope.goToLobby = function(lobby){
    socketio.emit('getLobbyList');
    if(!(lobby.status==='#f44336'))
    {
      console.log('omg');
      
      socketio.emit('leave');
      socketio.emit('getRoom');
      socketio.emit('join',lobby.name);
      socketio.emit('getRoom');
      if(lobby.state==='#0091ea')
      {
        socketio.emit('playerStatusUpdate',3);
      }
      $location.path('/game');
    } 
  };

  $scope.$on('$destroy', function (event) {
    socketio.removeAllListeners();
  });

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

function getStatusColor(status)
{
  if(status===0)
  {
    return '#F44336';
  }
  else if(status===1)
  {
    return '#4CAF50';
  }
  else if(status===2)
  {
    return '#0091ea';
  }
  else if(status===3)
  {
    return '#FFEB3B';
  }

}
function getStatusName(status)
{
  if(status===0)
  {
    return 'Not Ready';
  }
  else if(status===1)
  {
    return 'Ready!';
  }
  else if(status===2)
  {
    return 'In Game';
  }
  else if(status===3)
  {
    return 'Spectating';
  }

}

