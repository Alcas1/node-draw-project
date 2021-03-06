
var connected=false;
angular.module('nodedrawApp')
.controller('GameCtrl', function ($scope, $http, $location, Auth,User,socket) {
  var allColors=[
  {colorName:'Red',colorHex:'#F44336'},
  {colorName:'Orange',colorHex:'#FF9800'},
  {colorName:'Yellow',colorHex:'#FFEB3B'},
  {colorName:'Green',colorHex:'#4CAF50'},
  {colorName:'Blue',colorHex:'#2196F3'},
  {colorName:'Purple',colorHex:'#9C27B0'},
  {colorName:'Pink',colorHex:'#E91E63'},
  {colorName:'Grey',colorHex:'#9E9E9E'},
  {colorName:'Brown',colorHex:'#795548'},
  {colorName:'Black',colorHex:'#212121'}];
  $scope.Colors=allColors;
  var curColor=allColors[9].colorHex;
  var socketio=socket.socket;
  $scope.playerStatus=1;
  $scope.state=0;
  var localTimer;
  var localTime=0;
  var emitted=false;
  var clickX = new Array();
  var clickY = new Array();
  var clickDrag = new Array();
  var clickColor = new Array();
  var paint;
  

  $scope.switchColor=function(colorHex,item){
    $scope.selectedIndex = item;
    curColor=colorHex;
  }




  function addClick(x, y, dragging, color)
  {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
    clickColor.push(color);
  }
  var c = document.getElementById("draw");
  // c.style.width ='100%';
  // c.style.height='100%';
  c.width  = c.offsetWidth;
  c.height = c.offsetHeight;
  var ctx = c.getContext("2d");
  $(window).on('resize', function() {
   updateCanvasSize($scope.playerStatus);
 });

  $(function() {
    $("html, body, *").mousewheel(function(event, delta) {
        this.scrollLeft -= (delta * 80);
        this.scrollRight -= (delta * 80);
        event.preventDefault();
    });
});

  function updateCanvasSize(status){
    if(status===2)
    {
      c.width = $('#draw').width();
      c.height = $('#draw').height();
      ctx.lineJoin = "round";
      ctx.lineWidth = 5;
      for(var i=0; i < clickX.length; i++) {  
        ctx.strokeStyle = clickColor[i];
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
 }

 function canvasEvents(status)
 {
  if(status===2)
  {

   $('#draw').mousedown(function(e){

    var mouseX = ((e.pageX -15)/$('#draw').width())*$('#draw').width();
    var mouseY = ((e.pageY -70)/$('#draw').height())*$('#draw').height();
    paint = true;
    addClick(mouseX,mouseY,false,curColor);
    resizeCanvas();
  });


   $('#draw').mousemove(function(e){
    if(paint){
     var mouseX = ((e.pageX -15)/$('#draw').width())*$('#draw').width();
     var mouseY = ((e.pageY -70)/$('#draw').height())*$('#draw').height();
     addClick(mouseX, mouseY, true,curColor);
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
            ctx.lineJoin = "round";
            ctx.lineWidth = 5;
            for(var i=0; i < clickX.length; i++) {  
              ctx.strokeStyle = clickColor[i];
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

   // $('#draw-game').height($('#draw-game').width());
   var curLobby;
   if($location.search().lobby.substring(0,1)==='#')
   {
    var location=$location.search();
    $location.search({lobby:location.lobby.substring(1,location.lobby.length)});
  }
  else{
    var location=$location.search();
    socketio.emit('getRoom');
    socketio.emit('leave');
    socketio.emit('getRoom');
    socketio.emit('join',location.lobby);
    socketio.emit('getRoom');
  }





  $("#userMsg").keypress(function (e) {
    if(e.which == 13) {
     socketio.emit('sendChat',$(this).val());
     $(this).val("");
     e.preventDefault();
   }
 });
  socketio.on('joinInGame',function(curLobby)
  { 
    $scope.timeLeft='Getting Game Time...';
    $scope.$apply();
    socketio.emit('playerStatusUpdate',3);
    console.log('Time: '+curLobby.time);
    if(curLobby.time<=0)
    {
      $scope.state=2;
    }
    else
    {
      $scope.state=1;
    }
  });
  socketio.on('resetRoom',function(){
    socketio.emit('playerStatusUpdate',0);
    curColor=allColors[9].colorHex;
    $scope.playerStatus=0;
    $scope.state=0;
    emitted=false;
    clickX = [];
    clickY = [];
    clickDrag = [];
    clickColor = [];
    paint=null;
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
        name: "Guest "+this.id.substring(0,5),
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
   $scope.usersInGame=nLobby.usersInGame;
   if(this.id===nLobby.adminId)
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



  socketio.on('setClientTime',function(time){
    clearInterval(localTimer);
    localTimer=setInterval(updateTime,1000);
    localTime=time;
    $scope.timeLeft=localTime;
    $scope.$apply();
  });


  socketio.on('gameFinish',function(){
    if($scope.playerStatus===2)
    {
      var dataURL = c.toDataURL('image/png');
      socketio.emit('finishedDrawing',dataURL);
    }
    $scope.state=2;
    $scope.drawings=0;
  });

  socketio.on('drawingsSubmitted',function(){
    socketio.emit('prepDisplay',++$scope.drawings);
  });

  socketio.on('displayImages',function(){
    // console.log(curLobby);
    var ctxArray=[];
    for(var i=0;i<$scope.usersInGame.length;i++)
    {

      var img=new Image();
      var canvasName=("canvas")+(i+1);
      //$('#'+canvasName).height
      var c1 = document.getElementById(canvasName);
      c1.width  = window.innerHeight-200;
      c1.height = window.innerHeight-200;
      // c1.width=$('#'+canvasName).height();
      // c1.height=$('#'+canvasName).height();
      var ctx1 = c1.getContext("2d");
      ctxArray.push(ctx1);
      ctxArray=shuffle(ctxArray);
      img.onload = (function (nr) {
        return function(){
          ctxArray[nr].drawImage(img,0,0);
          if($scope.usersInGame.length-1===nr)
          {
            return;
          }
          console.log(nr);
          img.src=curLobby.usersInGame[nr].image;
        }
      }(i));

      img.src=curLobby.usersInGame[i].image;
    }



    if($scope.usersInGame.length===1)
    {




    }
    else if($scope.usersInGame.length===2)
    {

    }
    else if($scope.usersInGame.length===3)
    {

    }
  });


socketio.on('disconnect',function(){
    //alert('DISCONNECTED');
  });


function shuffle(array) {
  var m = array.length;
  var t,i;
  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}


socketio.on('setClientStatus',function(status)
{
 $scope.playerStatus=status;
 canvasEvents(status);
});

socketio.on('startClientGame',function(){
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
  if($scope.Ready==='Start')
  {
    var gameTimeLimit=10;
    socketio.emit('setGameTime',gameTimeLimit);
    localTime=gameTimeLimit;
    $scope.timeLeft=localTime;
    socketio.emit('startGame');
    socketio.emit('updateChat',"Game Started!");
  }
  else{

   socketio.emit('playerStatusUpdate',1);
 }
}

function updateTime(){
  localTime-=1;
  $scope.timeLeft=localTime;
  $scope.$apply();
  console.log(localTime);
  if(localTime<=0)
  {
    clearInterval(localTimer);
  }
}

});


