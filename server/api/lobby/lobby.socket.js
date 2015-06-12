/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var lobby = require('./lobby.model');

exports.register = function(socket) {
  lobby.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  lobby.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('lobby:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('lobby:remove', doc);
}