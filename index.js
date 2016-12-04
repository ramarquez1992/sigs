#!/usr/bin/env node

// INCLUDES
var path = require('path'),
  argv = require('minimist')(process.argv.slice(2)),
  five = require('johnny-five'),
  webServer = require('./js/webServer.js'),
  socket = null;

var serverPort = 8080;

// SERVER INITIALIZATION
webServer.start(serverPort);

function hertzToMs(hz) {
 return 1 / (hz * 1000);
}

var bufferSize = 10;

var uno = require('./js/hwInterface.js');
function sendData() {
  socket.emit('newDataRcvd', uno.getData(bufferSize));
}


// SOCKET CONTROLLER
webServer.io.sockets.on('connection', function (s) {
  socket = s; // Add socket to global scope

  setInterval(function() {
    socket.emit('toggleLabel', null);
    //uno.clrBuffer();
    sendData();
  }, 250);

  socket.on('clrBuffer', uno.clrBuffer);

});

