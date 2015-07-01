
var connected=false;
angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User,socket) {
	// var socketio = io('', {
	// 	path: '/socket.io-client'
	// });

var socketio=socket.socket;
$scope.playerStatus=1;
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
window.addEventListener('resize', canvasEvents($scope.playerStatus), false);



function canvasEvents(status)
{

  if(status===2)
  {
   $('#draw').mousedown(function(e){

    var mouseX = ((e.pageX -15)/$('#draw').width())*$('#draw').width();
    var mouseY = ((e.pageY -70)/$('#draw').height())*$('#draw').height();

				// console.log("page position X: "+(e.pageX-15));
				// console.log($('#draw').width());
				// console.log(((e.pageX -15)/$('#draw').width()));
				// console.log("page position Y: "+(e.pageY-70));
				// console.log($('#draw').height())
				// console.log("mouseX: "+mouseX);
				// console.log("mouseY: "+mouseY);
				paint = true;
				addClick(mouseX,mouseY);
				resizeCanvas();
			});


   $('#draw').mousemove(function(e){
    if(paint){
     addClick(e.pageX-15, e.pageY-70, true);
     resizeCanvas();
   }
 });

   $('#draw').mouseup(function(e){
    paint = false;
  });

   $('#draw').mouseleave(function(e){
    paint = false;
  });
   function resizeCanvas() {
    c.width = $('#draw').width();
    c.height = $('#draw').height();
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
  				redraw();
  			}
  			resizeCanvas();
  		}

  	}


  	var curLobby;
  	socketio.emit('getRoom');
  	// console.log(socket.socket);

  	
  	$("#userMsg").keypress(function (e) {
  		if(e.which == 13) {
  			socketio.emit('sendChat',$(this).val());
  			$(this).val("");
  			e.preventDefault();
  		}
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
    socketio.on('updateRoom',function(nLobby){
     $scope.lobby=nLobby;
     console.log(nLobby);
     console.log(this.id);
     if(this.id===nLobby.adminId)
     {
      console.log('start');
      $scope.Ready='Start';
    }
    else
    {
      $scope.Ready='Ready';
    }
    console.log('apply');
    $scope.$apply();
    curLobby=nLobby;

  });
    socketio.on('incrementSecond',function()
    {

     socketio.emit('setGameTime',$scope.timeLeft--);
     $scope.$apply();
   });

    socketio.on('setClientTime',function(time){
     $scope.timeLeft=time;
   });


    socketio.on('gameFinish',function(){
     $scope.state=2;
   });

    socketio.on('joinInGame',function()
    {
     socketio.emit('getLobbyTime');
     socketio.emit('getPlayerStatus');
     $scope.state=1;
   });



    socketio.on('setClientStatus',function(status)
    {
     $scope.playerStatus=status;
     canvasEvents(status);
   });

    socketio.on('startClientGame',function(){
     socketio.emit('getLobbyTime');
     socketio.emit('getPlayerStatus');
     $scope.state=1;
   });


    socketio.on('chatMessage',function(msg){
     $('#messages-chat').append($('<li>').text(msg));
     $("#messages-chat").scrollTop($("#messages-chat")[0].scrollHeight);
   });

     $scope.$on('$destroy', function (event) {
        socketio.removeAllListeners();
    });
    $scope.playerReady=function(){
      console.log(socket.socket);
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
