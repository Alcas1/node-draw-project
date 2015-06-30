'use strict';
var connected=false;
angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User) {
	var socketio = io('', {
		path: '/socket.io-client'
	});
	$scope.state=0;

	var clickX = new Array();
	var clickY = new Array();
	var clickDrag = new Array();
	var paint;

	function addClick(x, y, dragging)
	{
		clickX.push(x);
		clickY.push(y);
		clickDrag.push(dragging);
	}

	var c = document.getElementById("draw");
	c.style.width ='100%';
	c.style.height='100%';
  	
  	c.width  = c.offsetWidth;
  	c.height = c.offsetHeight;
  	var ctx = c.getContext("2d");
  	$('#draw').mousedown(function(e){
  		
  		var mouseX = e.pageX - this.offsetLeft-15;
  		var mouseY = e.pageY - this.offsetTop-70;

  		paint = true;
  		addClick(e.pageX - this.offsetLeft-15, e.pageY - this.offsetTop-70);
  		redraw();
  	});


  	$('#draw').mousemove(function(e){
  		if(paint){
  			console.log('mousemove paint');
  			addClick(e.pageX - this.offsetLeft-15, e.pageY - this.offsetTop-70, true);
  			redraw();
  		}
  	});

  	$('#draw').mouseup(function(e){
  		console.log('mouseup');
  		paint = false;
  	});

  	$('#draw').mouseleave(function(e){
  		console.log('mouseleave');
  		paint = false;
  	});

  	function redraw(){
  		// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas

  		ctx.strokeStyle = "#df4b26";
  		ctx.lineJoin = "round";
  		ctx.lineWidth = 5;
  		for(var i=0; i < clickX.length; i++) {	
  			ctx.beginPath();
  			if(clickDrag[i] && i){
  				ctx.moveTo(clickX[i-1], clickY[i-1]);
  			}else{
  				ctx.moveTo(clickX[i]-1, clickY[i]);
  			}
  			ctx.lineTo(clickX[i], clickY[i]);
  			ctx.closePath();
  			ctx.stroke();
  		}
  	}




  	var curLobby;
  	socketio.emit('getRoom');
  	socketio.on('updateRoom',function(nLobby){
  		$scope.lobby=nLobby;
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

  	socketio.on('incrementSecond',function()
  	{

  		socketio.emit('setGameTime',$scope.timeLeft--);
		// $scope.timeLeft--;
		$scope.$apply();
	});

  	socketio.on('setClientTime',function(time){
  		$scope.timeLeft=time;
  	});

  	socketio.on('joinInGame',function()
  	{
		// socketio.emit('getLobbyTime');
		// $scope.state=1;
	});

  	socketio.on('startClientGame',function(){
  		socketio.emit('getLobbyTime');
  		$scope.state=1;
  	});

  	if(!connected)
  	{
  		socketio.on('chatMessage',function(msg){
  			$('#messages-chat').append($('<li>').text(msg));
  			$("#messages-chat").scrollTop($("#messages-chat")[0].scrollHeight);
  		});


  		connected=true;
  	}
  	$scope.playerReady=function(){
		// socketio.emit('updateChat','omg');
		if($scope.Ready==='Start')
		{
			socketio.emit('setGameTime',45);
			socketio.emit('getLobbyTime');
			socketio.emit('startGame');
			// $scope.state=1;
		}
		else{

			socketio.emit('playerStatusUpdate',1);
		}
	}

	

});
