'use strict';

angular.module('nodedrawApp')
  .controller('LoginCtrl', function ($scope, $location, Auth, User) {
    $scope.user = {};
    $scope.errors = {};
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    var socketio = io('', {
      path: '/socket.io-client'
    });
    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          // Logged in, redirect to home
          $scope.getCurrentUser=User.get();
          $scope.getCurrentUser.$promise.then(function(data) {
            socketio.emit('leave');
            socketio.emit('getRoom');
            socketio.emit('updateUser',data);
          });
          socketio.emit('getRoom');
          $location.path('/');
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

  });
