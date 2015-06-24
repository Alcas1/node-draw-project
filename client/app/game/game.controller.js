'use strict';

angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User) {
	var socketio = io('', {
		path: '/socket.io-client'
	});
	var lobbyName="Lobby";
	var curLobby;
	$scope.players=[];
	socketio.emit('getRoom');
	console.log("GameCtrl");
	socketio.on('updateRoom',function(lobby){
		curLobby=lobby;
		$scope.lobbyName=lobby.name;
		$scope.players=lobby.users;
		$scope.$apply();
		curLobby=lobby;
	});
	socketio.on('lobbyName',function(lobby){
		$scope.lobbyName=lobby;
		$scope.$apply();
		curLobby=lobby;
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
				name: "Guest "+socketio.id.substring(0,8),
				email: "",
				role: "user",
				tempScore:0,
				totalScore:0,
				provider: "local",
			};
			socketio.emit('updateUser',curUser);
		}

	});
  	//$scope.getCurrentUser=User.get();

  	console.log(socketio.id);
  });
