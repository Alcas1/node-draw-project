/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /lobbys              ->  index
 * POST    /lobbys              ->  create
 * GET     /lobbys/:id          ->  show
 * PUT     /lobbys/:id          ->  update
 * DELETE  /lobbys/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var lobby = require('./lobby.model');

// Get list of lobbys
exports.index = function(req, res) {
  lobby.find(function (err, lobbys) {
    if(err) { return handleError(res, err); }
    return res.json(200, lobbys);
  });
};

// Get a single lobby
exports.show = function(req, res) {
  lobby.findById(req.params.id, function (err, lobby) {
    if(err) { return handleError(res, err); }
    if(!lobby) { return res.send(404); }
    return res.json(lobby);
  });
};

// Creates a new lobby in the DB.
exports.create = function(req, res) {
  lobby.create(req.body, function(err, lobby) {
    if(err) { return handleError(res, err); }
    return res.json(201, lobby);
  });
};

// Updates an existing lobby in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  lobby.findById(req.params.id, function (err, lobby) {
    if (err) { return handleError(res, err); }
    if(!lobby) { return res.send(404); }
    var updated = _.merge(lobby, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, lobby);
    });
  });
};

// Deletes a lobby from the DB.
exports.destroy = function(req, res) {
  lobby.findById(req.params.id, function (err, lobby) {
    if(err) { return handleError(res, err); }
    if(!lobby) { return res.send(404); }
    lobby.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}