var webServer = require('./js/webServer.js'),
  uno = require('./js/hwInterface.js');


// SERVER
var socket = null;
var serverPort = 8080;
webServer.start(serverPort);


// SOCKET CONTROLLER
webServer.io.sockets.on('connection', function (s) {
  socket = s; // Add socket to global scope
  uno.clrBuffer();

  setInterval(function() {
    sendData();
  }, 10);  // TODO: dynamically set to frameSize/sampleRate

  socket.on('clrBuffer', uno.clrBuffer);
});


// HARDWARE
var maxBufferSize = 10;

function sendData() {
  socket.emit('newDataRcvd', uno.getData(maxBufferSize));
}


// MISC FUNCS
function hertzToMs(hz) {
 return 1 / (hz * 1000);
}
