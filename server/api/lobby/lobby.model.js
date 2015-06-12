'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LobbySchema = new Schema({
  name: String,
  players: Number,
  playerList:{}
});

module.exports = mongoose.model('Lobby', LobbySchema);