'use strict';

angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User) {
	var socketio = io('', {
		path: '/socket.io-client'
	});
	
	console.log($scope.state);

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

  });