/**
 * Main application file
 */

 'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
	'pingInterval':1000,
	'pingTimeout':1000,
	serveClient: (config.env === 'production') ? false : true,
	path: '/socket.io-client'
});

require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
	console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});
var usernames = {};
var numUsers=0;
function lobby(name,code,players) {
	this.name=name;
	this.code=code;
	this.minPlayers=2;
	this.maxPlayers=players;
	this.users=[];
	this.usersInGame=[];
	this.adminId;
	this.category;
	this.state;
	this.status;
	this.statusName;
	this.time;
}
var lobbies = [];
var connected=false;



var getLobby=function(lobbyName)
{
	for(var i=0;i<lobbies.length;i++)
	{
		if((lobbyName)===(lobbies[i].name))
			return lobbies[i];
	}
}

var getLobbyPosition=function(lobbyName)
{
	for(var i=0;i<lobbies.length;i++)
	{
		if((lobbyName)===(lobbies[i].name))
			return i;
	}
}

var updateLobby=function(socket)
{
	//problem is on leave that socket.room gets undefined
	var users=socketio.sockets.sockets;
	var room=null;
	if(socket.toDelete)
	{

		var index=getLobbyPosition(socket.prevRoom);
		console.log("Lobby Index Deleted: "+index+" Lobby Name: "+socket.prevRoom);
		lobbies.splice(index, 1);
		socket.toDelete=false;
	}
	if(socket.room&&!socket.prevRoom){
		room=socket.room;
	}
	if(!socket.room&&socket.prevRoom)
	{
		room=socket.prevRoom;
	}
	//after joining or creating a lobby second time
	if(socket.room&&socket.prevRoom)
	{
		room=socket.room;
	}
	var curLobby=getLobby(room);
	if(curLobby&&users&&(socket.prevRoom||socket.room))
	{
		var toPush=[];
		for(var i=0;i<users.length;i++)
		{
			if(users[i].room===curLobby.name)
			{	
				if(users[i].id===socket.id)
				{
					users[i].user.status=socket.status;
				}
				toPush.push({userId:users[i].id,userName:users[i].user.name,status:users[i].user.status});

			}
		}
		curLobby.users=toPush;
		curLobby.usersInGame=[];
		var adminHere=false;
		for(var i=0;i<toPush.length;i++)
		{

			if(toPush[i].status===2)
			{
				if(toPush[i].userId===socket.id)
				{
					toPush[i].image=socket.image;
				}
				curLobby.usersInGame.push({userId:toPush[i].userId,image:toPush[i].image});
			}
			if(toPush[i].userId===curLobby.adminId)
				adminHere=true;
		}
		if(!adminHere)
		{
			if(curLobby&&toPush.length>0)
			{
				curLobby.adminId=toPush[0].userId;
			}
		}
		if(curLobby.users.length===curLobby.maxPlayers)
		{
			curLobby.status='#f44336';
			curLobby.statusName='Lobby Full!';
			if(socket.state===1)
			{
				curLobby.state='#0091ea';
			}
		}
		else if(!(curLobby.code===''||!curLobby.code)){
			curLobby.status='#ffc107';
			curLobby.statusName='Private Lobby';
			if(socket.state===1)
			{
				curLobby.state='#0091ea';
			}
		}
		else
		{
			curLobby.status='#4caf50';
			curLobby.statusName='Public Lobby';
			if(socket.state===1)
			{
				curLobby.state='#0091ea';
			}
		}
		socketio.to(room).emit('updateRoom',curLobby);
	}
	socketio.sockets.emit('updateLobbyList',lobbies);

}

//update time on client side
//send one signal
//sync every 10 seconds
socketio.on('connection', function(socket) {
	if(!connected)
	{
		socket.status=0;
		connected=true;
	}	

	socket.on('getUserNum',function(){
		socketio.sockets.emit('userCountChange',numUsers);
	});

	console.log("Total Users on Server: "+(++numUsers));
	socket.on('getLobbyList',function(){
		socketio.sockets.emit('updateLobbyList',lobbies);
	});

	socketio.sockets.emit('userCountChange',numUsers);
	socket.on('createLobby',function(newLobby)
	{
		var isCreated=false;
		for(var i=0;i<lobbies.length;i++)
		{
			if((newLobby.lobbyName)===(lobbies[i].name))
				isCreated=true;
		}
		if(!isCreated)
		{
			var nLobby=new lobby(newLobby.lobbyName,newLobby.code,newLobby.lobbyPlayerNum);
			nLobby.adminId=socket.id;
			socket.room=nLobby.name;
			socket.status=0;
			socket.join(nLobby.name);
			console.log("Created and joined lobby: "+nLobby.name);
			var users=socketio.sockets.sockets;
			var toPush=[];
			for(var i=0;i<users.length;i++)
			{
				if(users[i].room===nLobby.name)
				{
					toPush.push({userId:users[i].id,userName:users[i].user.name,status:0});
				}
			}
			nLobby.users=toPush;
			console.log(toPush);
			lobbies.unshift(nLobby);
			//socketio.sockets.in(nLobby.name).emit('chatMessage',socket.user.name+' has Joined');
		}

	});
	socket.on('leave',function(name){

		if(socket.room)
		{
			var curLobby=getLobby(socket.room);
			socket.prevRoom=socket.room;
			var users=curLobby.users;
			var usersInRoom=0;
			var usersInGame=0;
			var isCurUser=false;
			for(var i=0;i<users.length;i++)
			{
				if(users[i].status===2)
				{
					usersInGame++;
					if(users[i].userId===socket.id)
					{
						isCurUser=true;
					}
				}
				usersInRoom++;		
			}
			if(usersInRoom===1)
			{	
				socket.toDelete=true;
			}
			if(isCurUser)
			{
				if(usersInGame===1)
				{

					for(var i=0;i<lobbies.length;i++)
					{
						if(socket.room===lobbies[i].name)
						{
							socket.state=null;
							lobbies[i].state=null;
							socketio.sockets.in(socket.room).emit('resetRoom');
						}
					}
				}
			}
			socket.leave(socket.room);
			socketio.sockets.in(socket.room).emit('chatMessage',socket.user.name+' has Left');
			socket.room=null;
		}

		socketio.sockets.emit('updateLobbyList',lobbies);
	});
	socket.on('join',function(name){

		var curLobby=getLobby(name);
		if(curLobby&&socket.user){
			console.log("Joined Room: "+name);
			if(socket.room)
			{
				socket.prevRoom=socket.room;
			}
			socket.room=name;
			socket.status=0;
			socket.join(name);
			var users=socketio.sockets.sockets;
			var toPush=[];
			for(var i=0;i<users.length;i++)
			{
				if(users[i].room===curLobby.name)
				{
					toPush.push({userId:users[i].id,userName:users[i].user.name,status:0});
				}
			}
			curLobby.users=toPush;
			if(curLobby.state==='#0091ea')
			{

				socket.emit('joinInGame',curLobby);
			}
		}
		if(socket.user)
		{
			socketio.sockets.in(name).emit('chatMessage',socket.user.name+' has Joined');
		}
	});

	socket.on('getRoom',function(){
		updateLobby(socket);
	});


	socket.on('playerStatusUpdate',function(status){
		socket.status=status;
		updateLobby(socket);
	});

	socket.on('startGame',function(){
		var curLobby=getLobby(socket.room);
		var users=socketio.sockets.sockets;
		for(var i=0;i<users.length;i++)
		{
			if(users[i].room===curLobby.name)
			{
				if(users[i].user.status===1)
				{
					users[i].user.status=2;
				}
				else{
					users[i].user.status=3;
				}
			}
		}
		socketio.sockets.in(socket.room).emit('startClientGame');
		socket.status=2;
		socket.state=1;
		updateLobby(socket);
	});

	socket.on('getPlayerStatus',function(){
		var users=getLobby(socket.room).users;
		for(var i=0;i<users.length;i++)
		{	
			if(users[i].userId===socket.id)
			{
				socket.emit('setClientStatus',users[i].status);
			}
		}


	});
	socket.on('setGameTime',function(seconds){
		var localTime=seconds;
		socketio.sockets.in(socket.room).emit('setClientTime',localTime);
		function updateGameTime()
		{
			localTime-=10;
			socketio.sockets.in(socket.room).emit('setClientTime',localTime);
			console.log(localTime);
			if(localTime-10<=0){
				console.log('omfg lol');
				clearInterval(localTimer);
				setTimeout(function(){
					socketio.sockets.in(socket.room).emit('setClientTime',0);
					socketio.sockets.in(socket.room).emit('gameFinish');
					socketio.sockets.in(socket.room).emit('chatMessage',"Let's See What Everyone Drew!");
					//lobbies[i].state=null;
				}, seconds*1000);

			}
		}
		var localTimer=setInterval(updateGameTime, 10000);
		
		
		
		// for(var i=0;i<lobbies.length;i++)
		// {
		// 	if(lobbies[i].name===socket.room)
		// 	{
		// 		lobbies[i].time=seconds;
		// 		if(seconds<=1&&lobbies[i].state)
		// 		{	
		// 			if(lobbies[i].adminId===socket.id)
		// 			{	

		// 				socketio.sockets.in(socket.room).emit('gameFinish');
		// 				if(lobbies[i].usersInGame.length===1)
		// 				{
		// 					//socketio.sockets.in(socket.room).emit('chatMessage',"Let's See What" + lobbies[i].usersInGame[0].userId+ "Drew!");
		// 					socketio.sockets.in(socket.room).emit('chatMessage',"Let's See What Everyone Drew!");
		// 				}
		// 				else
		// 				{
		// 					socketio.sockets.in(socket.room).emit('chatMessage',"Let's See What Everyone Drew!");
		// 				}
		// 				lobbies[i].state=null;
		// 			}
		// 		}
		// 	}
		// }

	});

socket.on('finishedDrawing',function(img){
	console.log('finished drawing');
	socket.image=img;
	var curLobby=getLobby(socket.room);
	for(var i=0;i<curLobby.usersInGame.length;i++)
	{
		if(curLobby.usersInGame[i].userId===socket.id)
		{
			curLobby.usersInGame[i].image=socket.image;
		}

	}
	socketio.sockets.in(socket.room).emit('updateRoom',curLobby);
	socketio.sockets.in(socket.room).emit('drawingsSubmitted');

});

socket.on('prepDisplay',function(drawingNumber){
	var curLobby=getLobby(socket.room);
	if(drawingNumber===curLobby.usersInGame.length){

		socket.emit('displayImages');

			//alert('DISPLAY ALL IMAGES WE READY');
		}
	});


socket.on('updateUser',function(curUser){
	socket.user=curUser;
});

socket.on('updateChat',function(msg){
	socketio.sockets.in(socket.room).emit('chatMessage',msg);
});

socket.on('sendChat',function(msg){
	socketio.sockets.in(socket.room).emit('chatMessage',socket.user.name+': '+msg);
});


socket.on('disconnect', function() {
	console.log("Total Users on Server: "+(--numUsers));
	socketio.sockets.emit('userCountChange',numUsers);
	if(socket.room)
	{
		var curLobby=getLobby(socket.room);
		socket.prevRoom=socket.room;
		var users=curLobby.users;
		var usersInRoom=0;
		var usersInGame=0;
		var isCurUser=false;
		for(var i=0;i<users.length;i++)
		{
			if(users[i].status===2)
			{
				usersInGame++;
				if(users[i].userId===socket.id)
				{
					isCurUser=true;
				}
			}
			usersInRoom++;		
		}

		if(usersInRoom===1)
		{	
			socket.toDelete=true;
		}
		if(isCurUser)
		{
			if(usersInGame===1)
			{

				for(var i=0;i<lobbies.length;i++)
				{
					if(socket.room===lobbies[i].name)
					{

						socket.state=null;
						lobbies[i].state=null;
						socketio.sockets.in(socket.room).emit('resetRoom');
					}
				}
			}
		}
	}
	updateLobby(socket);
	socket.leave(socket.room);
	if(socket.user)
	{
		socketio.sockets.in(socket.room).emit('chatMessage',socket.user.name+' has Disconnected');
	}
	socket.room=null;
});

});




// Expose app
exports = module.exports = app;