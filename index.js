#!/usr/bin/env node

// INCLUDES
var path = require('path'),
  argv = require('minimist')(process.argv.slice(2)),
  five = require('johnny-five'),
  webServer = require('./js/webServer.js'),
  socket = null;


// SERVER
var serverPort = 8080;
webServer.start(serverPort);


// HARDWARE
var uno = require('./js/hwInterface.js');
var bufferSize = 10;

function sendData() {
  socket.emit('newDataRcvd', uno.getData(bufferSize));
}


// SOCKET CONTROLLER
webServer.io.sockets.on('connection', function (s) {
  socket = s; // Add socket to global scope
  //uno.clrBuffer();

  setInterval(function() {
    sendData();
  }, 250);

  socket.on('clrBuffer', uno.clrBuffer);
});


// MISC FUNCS
function hertzToMs(hz) {
 return 1 / (hz * 1000);
}

