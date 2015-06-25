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
	this.players;
	this.minPlayers=2;
	this.maxPlayers=players;
	this.users=[];
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

var updateLobby=function(socket)
{
	//problem is on leave that socket.room gets undefined
		//
		var users=socketio.sockets.sockets;
		var room;

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
		if(users&&(socket.prevRoom||socket.room))
		{
			var curLobby=getLobby(room);
			var toPush=[];
			for(var i=0;i<users.length;i++)
			{
				if(users[i].room===curLobby.name)
				{
					toPush.push({userId:users[i].id,userName:users[i].user.name});
				}
			}
			curLobby.users=toPush;
			socketio.to(room).emit('updateRoom',curLobby);
		}
}

socketio.sockets.on('connection', function(socket) {
	if(!connected)
	{
		setInterval(function()
		{
			socketio.sockets.emit('updateLobbyList',lobbies);
			console.log("Total Lobbies on Server: "+lobbies.length)
		}, 5000);
		setInterval(function()
		{
			socketio.sockets.emit('userCountChange',numUsers);
		}, 1000);
		connected=true;
	}	


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
			socket.room=nLobby.name;
			socket.join(nLobby.name);
			console.log("Created and joined lobby: "+nLobby.name);
			var users=socketio.sockets.sockets;
			var toPush=[];
			for(var i=0;i<users.length;i++)
			{
				if(users[i].room===nLobby.name)
				{
					toPush.push({userId:users[i].id,userName:users[i].user.name});
				}
			}
			nLobby.users=toPush;
			console.log(toPush);
			lobbies.unshift(nLobby);

		}

	});
	socket.on('leave',function(name){
		var curLobby=getLobby(name);
		if(socket.room)
		{
			socket.prevRoom=socket.room;
			socket.leave(socket.room);
			console.log("Left Room: "+socket.room);
			socket.room=null;
			

		}

	});
	socket.on('join',function(name){
		
		var curLobby=getLobby(name);
		console.log("Joined Room: "+name);
		if(socket.room)
		{
			socket.prevRoom=socket.room;
		}
		socket.room=name;
		socket.join(name);
		var users=socketio.sockets.sockets;
		var toPush=[];
		for(var i=0;i<users.length;i++)
		{
			if(users[i].room===curLobby.name)
			{
				toPush.push({userId:users[i].id,userName:users[i].user.name});
			}
		}
		curLobby.users=toPush;
		//console.log(toPush);
		//socketio.to(name).emit('updateRoom',curLobby);

	});

	socket.on('getRoom',function(){
		updateLobby(socket);
	});

	socket.on('playerReady',function(){


	});

	socket.on('updateUser',function(curUser){
		socket.user=curUser;
		//console.log(socket.user);
	});


	socket.on('disconnect', function() {
		console.log("Total Users on Server: "+(--numUsers));
		socketio.sockets.emit('userCountChange',numUsers);
		if(socket.room)
		{
			socket.prevRoom=socket.room;
			socket.leave(socket.room);
			console.log("Left Room: "+socket.room);
		}
		updateLobby(socket);
		
	});
	
});




// Expose app
exports = module.exports = app;