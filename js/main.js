// IMPORT JSON

function draw(plotData) {

  var canvas = document.getElementById("timeDomainCanvas");
  var ctx = canvas.getContext("2d");
  var height = canvas.height;
  var width = canvas.width;

  ctx.clearRect(0, 0, width, height); //clear canvas
  var x = 0;
  ctx.beginPath();
  ctx.moveTo(0,height/2 - plotData[0]*height/2);
  for(var index in plotData) {
    y=plotData[index];
    //console.log(plotData);
    //console.log(y);
    ctx.lineTo(x, height/2 - y*height/2);
    x += width/(plotData.length-1.0);
  }
  ctx.stroke();
  ctx.closePath();
}

var mode = 'sine';

function setMode(newMode) {
  mode = newMode;
}

function logError(err) {
  alert('ERROR: ' + err);
}

// INIT
var socket = io.connect('http://localhost:8080');

$(document).ready(function() {
  initSocket();
  socket.emit('clrBuffer', null);
});

function initSocket() {
  socket.on('newDataRcvd', newDataRcvd);
}

//var audioCtx = new(window.AudioContext || window.webkitAudioContext || window.audioContext);
var audioCtx = new window.webkitAudioContext();

var channels = 1;
//var frameCount = audioCtx.sampleRate * 2.0;
var frameCount = audioCtx.sampleRate;
//frameCount = 512;
var arrayBuffer = audioCtx.createBuffer(channels, frameCount, audioCtx.sampleRate);

var dataBuffer = [];
function newDataRcvd(buffer) {
  //console.log(buffer);
  for (var i = 0; i < buffer.length; i++) {
    //console.log(buffer[i]);
    //dataBuffer[i] = buffer[i];
    dataBuffer.push(buffer[i]);
  }

  //test();
}

var source = audioCtx.createBufferSource();
source.loop = true;
source.buffer = arrayBuffer;
source.connect(audioCtx.destination);
//source.start();

var timer;
function startSound() {
  timer = window.setInterval(play, 50);
  source.start();
  play();
}

function stopSound() {
  source.stop();
  clearInterval(timer);
}

function play() {
  //beep(500, 2000, 1, 'sine', function() {} );

  // values between -1.0 and 1.0
  var nowBuffering = arrayBuffer.getChannelData(0);
  var waveBuffer = makeWave(mode, 440/dataBuffer[0], frameCount);
  //console.log(waveBuffer);

  //console.log(waveBuffer);
  //console.log(dataBuffer);

  var numChunks = frameCount/dataBuffer.length;
  var chunkSize = frameCount/numChunks;
  
  var d = dataBuffer[0];
  for (k = 0; k < frameCount; k++) {
    //console.log(waveBuffer[i]);
    nowBuffering[k] = waveBuffer[k];   // pure sine wave
    //nowBuffering[k] = waveBuffer[k] * dataBuffer[d];  // modulated amplitude
    //nowBuffering[k] = waveBuffer[k] * d;  // modulated amplitude
    if (k%chunkSize < 10 && d < dataBuffer.length-1) {
      d = dataBuffer.shift();
    }
    //console.log(d);
  }
  var drawBuffer = [];
  for (var i = 0; i < waveBuffer.length; i+=500) {
    drawBuffer.push(nowBuffering[i]);
  }
  draw(drawBuffer);

  //var source = audioCtx.createBufferSource();
  //source.buffer = arrayBuffer;
  //source.connect(audioCtx.destination);
  //source.onended = function() { play(); };
  //source.start();
  //test();
}

function beep(duration, frequency, volume, type, callback) {
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (volume){gainNode.gain.value = volume;}
  if (frequency){oscillator.frequency.value = frequency;}
  if (type){oscillator.type = type;}
  if (callback){oscillator.onended = callback;}

  oscillator.start();
  setTimeout(function(){oscillator.stop();}, (duration ? duration : 500));
}


