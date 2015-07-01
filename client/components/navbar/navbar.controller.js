'use strict';

angular.module('nodedrawApp')
.controller('NavbarCtrl', function ($scope, $location, Auth,socket) {
  $scope.menu = [{
    'title': 'Home',
    'link': '/'
  }];
  var socketio =socket.socket;
  $scope.isCollapsed = true;
  $scope.isLoggedIn = Auth.isLoggedIn;
  $scope.isAdmin = Auth.isAdmin;
  $scope.getCurrentUser = Auth.getCurrentUser;

  $scope.logout = function() {
    Auth.logout();
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
    socketio.emit('leave');
    socketio.emit('getRoom');
    $location.path('/login');
  };

  $scope.checkLeave = function(item){
    if(item.title==='Home'||item==='Home')
    {
      socketio.emit('stopTimer');
      socketio.emit('leave');
      socketio.emit('getRoom');
    }
  }

  $scope.isActive = function(route) {
    return route === $location.path();
  };

  $scope.$on('$destroy', function (event) {
        socketio.removeAllListeners();
    });
});