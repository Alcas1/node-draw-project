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
			//PROMPT FOR USERNAME
			var curUser ={
				name: "Guest "+socketio.id.substring(0,5),
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

	$("#userMsg").keypress(function (e) {
		if(e.which == 13) {
			socketio.emit('sendChat',$(this).val());
			$(this).val("");
			e.preventDefault();
		}
	});

	socketio.on('chatMessage',function(msg){
		$('#messages-chat').append($('<li>').text(msg));
		$("#messages-chat").scrollTop($("#messages-chat")[0].scrollHeight);
	});
	$scope.playerReady=function(){
		socketio.emit('updateChat','omg');
		if($scope.Ready==='Start')
		{
			
			socketio.emit('startGame')
		}
		else{


			socketio.emit('playerStatusUpdate',1);
		}
	}

});
