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
		var adminHere=false;
		for(var i=0;i<toPush.length;i++)
		{
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

// function shuffle(array) {
//   var m = array.length, t, i;

//   // While there remain elements to shuffle…
//   while (m) {

//     // Pick a remaining element…
//     i = Math.floor(Math.random() * m--);

//     // And swap it with the current element.
//     t = array[m];
//     array[m] = array[i];
//     array[i] = t;
//   }

//   return array;
// }

socketio.on('connection', function(socket) {
	if(!connected)
	{
		setInterval(function(){
					// socketio.sockets.in(socket.room).emit('updateTime', seconds); 
					socketio.sockets.emit('incrementSecond');
				}, 1000);
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
		if(curLobby){
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
		socketio.sockets.in(name).emit('chatMessage',socket.user.name+' has Joined');
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

		for(var i=0;i<lobbies.length;i++)
		{
			if(lobbies[i].name===socket.room)
			{
				lobbies[i].time=seconds;
				if(seconds<=0&&lobbies[i].state)
				{	
					if(lobbies[i].adminId===socket.id)
					{	
						lobbies[i].state=null;
						socketio.sockets.in(socket.room).emit('gameFinish');
						socketio.sockets.in(socket.room).emit('chatMessage',"Let's See What Everyone Drew!");
					}
				}
			}
		}

	});

	socket.on('getLobbyTime',function(){
		socketio.sockets.in(socket.room).emit('setClientTime',getLobby(socket.room).time);
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
		socketio.sockets.in(socket.room).emit('chatMessage',socket.user.name+' has Disconnected');
		socket.room=null;
	});

});




// Expose app
exports = module.exports = app;