'use strict';

angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User) {
	var socketio = io('', {
		path: '/socket.io-client'
	});
	
	var curLobby;
	socketio.emit('getRoom');
	socketio.on('updateRoom',function(nLobby){
		$scope.lobby=nLobby;
		console.log(socketio.id);
		if(socketio.id===nLobby.adminId)
		{
			$scope.Ready='Start';
		}
		else
		{
			$scope.Ready='Ready';
		}
		$scope.$apply();
		curLobby=nLobby;

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
				status:0
			};
			socketio.emit('updateUser',curUser);
		}

	});


	$scope.playerReady=function(){
		if($scope.Ready==='Start')
		{
			
			socketio.emit('startGame')
		}
		else{


			socketio.emit('playerStatusUpdate',1);
		}
	}
  	//$scope.getCurrentUser=User.get();

  });
