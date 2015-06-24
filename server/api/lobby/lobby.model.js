'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LobbySchema = new Schema({
  name: String,
  players: Number,
  code:Number,
  playerList:[{
	pName:String,
  	pID:Number,
  	pTempScore:Number,
  	

  }]
  	
  
});

module.exports = mongoose.model('Lobby', LobbySchema);