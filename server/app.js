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
	this.minPlayers=2;
	this.maxPlayers=players;
	this.users=[];
	this.usersInGame=[];
	this.adminId;
	this.category;
	this.status;
	this.statusName;
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
		//
		var users=socketio.sockets.sockets;
		var room=null;

		if(socket.toDelete)
		{
			var index=getLobbyPosition(curLobby);
			console.log(index);
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
					toPush.push({userId:users[i].id,userName:users[i].user.name});
				}
			}
			curLobby.users=toPush;
			
			if(curLobby.users.length===curLobby.maxPlayers)
			{
				curLobby.status='#f44336';
				curLobby.statusName='Lobby Full!';
			}
			else if(!(curLobby.code===''||!curLobby.code)){
				curLobby.status='#ffc107';
				curLobby.statusName='Private Lobby';
			}
			else
			{
				curLobby.status='#4caf50';
				curLobby.statusName='Public Lobby';
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

socketio.sockets.on('connection', function(socket) {
	if(!connected)
	{
		// setInterval(function()
		// {
		// 	socketio.sockets.emit('updateLobbyList',lobbies);
		// 	console.log("Total Lobbies on Server: "+lobbies.length)
		// }, 3000);
		// setInterval(function()
		// {
		// 	socketio.sockets.emit('userCountChange',numUsers);
		// }, 1000);
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
		var users=socketio.sockets.sockets;
		var usersInRoom=0;
		for(var i=0;i<users.length;i++)
		{
			if(users[i].room===socket.room)
			{
				usersInRoom++;		
			}
		}
		if(usersInRoom===1)
		{	
			console.log(usersInRoom);
			socket.toDelete=true;
		}

		socket.leave(socket.room);

		console.log("Left Room: "+socket.room);
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
	}
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
		var users=socketio.sockets.sockets;
		var usersInRoom=0;
		for(var i=0;i<users.length;i++)
		{
			if(users[i].room===socket.room)
			{
				usersInRoom++;		
			}
		}
		if(usersInRoom===1)
		{	
			console.log(usersInRoom);
			socket.prevRoom=null;
		}

		socket.leave(socket.room);
		console.log("Left Room: "+socket.room);
	}
	updateLobby(socket);

});

});




// Expose app
exports = module.exports = app;