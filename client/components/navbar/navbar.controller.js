'use strict';

angular.module('nodedrawApp')
.controller('NavbarCtrl', function ($scope, $location, Auth) {
  $scope.menu = [{
    'title': 'Home',
    'link': '/'
  }];
  var socketio = io('', {
      path: '/socket.io-client'
    });
  $scope.isCollapsed = true;
  $scope.isLoggedIn = Auth.isLoggedIn;
  $scope.isAdmin = Auth.isAdmin;
  $scope.getCurrentUser = Auth.getCurrentUser;

  $scope.logout = function() {
    Auth.logout();
    var curUser ={
      name: "Guest "+socketio.id.substring(0,8),
      email: "",
      role: "user",
      tempScore:0,
      totalScore:0,
      provider: "local",
    };
    socketio.emit('updateUser',curUser);
    $location.path('/login');
  };

  $scope.isActive = function(route) {
    return route === $location.path();
  };
});