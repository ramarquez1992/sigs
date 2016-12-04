// GENERAL INIT
var socket = io.connect('http://localhost:8080');
var modType = 'amp';
var waveType = 'sine';

$(document).ready(function() {
  initSocket();
  socket.emit('clrBuffer', null);
});

function initSocket() {
  socket.on('newDataRcvd', newDataRcvd);
}

function setModType(inModType) {
  modType = inModType;
}

function setWaveType(inWaveType) {
  waveType = inWaveType;
}

// AUDIO INIT
var audioCtx;
if (window.AudioContext) audioCtx = new window.AudioContext();
else if (window.webkitAudioContext) audioCtx = new window.webkitAudioContext();
else if (window.audioContext) audioCtx = new window.audioContext();
else alert('Browser audio requirements not met');

var channels = 1;
var sampleRate = audioCtx.sampleRate;
var frameCount = sampleRate;
var arrayBuffer = audioCtx.createBuffer(channels, frameCount, sampleRate);

// IN MODULATION DATA
var modDataBuffer = [];
function newDataRcvd(inBuffer) {
  for (var i in inBuffer) {
    modDataBuffer.push(inBuffer[i]);
  }
}

var source;
var timer;
var timerInterval = 50;
var drawPoints = 200;

function startSound() {
  modDataBuffer.length = 0;  // clear old data

  source = audioCtx.createBufferSource();
  source.loop = true;
  source.buffer = arrayBuffer;
  source.connect(audioCtx.destination);
  source.start();

  timer = window.setInterval(function() {
    var outBuffer;

    switch (modType) {
    case 'amp':
      outBuffer = modAmp();
      break;
    case 'freq':
      outBuffer = modFreq();
      break;
    default:
      console.log('Unknown modulation type');
    }

    // Trim number of points that will be drawn
    var drawBuffer = [];
    var drawInterval = parseInt(outBuffer.length/drawPoints);
    for (var i = 0; i < outBuffer.length; i += drawInterval) {
      drawBuffer.push(outBuffer[i]);
    }
    draw(drawBuffer, 'timeDomainCanvas');

  }, timerInterval);
}

function stopSound() {
  source.stop();
  clearInterval(timer);
}

function modAmp() {
  // values between -1.0 and 1.0
  var nowBuffering = arrayBuffer.getChannelData(0);
  var waveBuffer = makeWave(waveType, 440, frameCount);

  var chunkSize = frameCount/modDataBuffer.length;
  
  var nextDatum = modDataBuffer[0];
  for (var i in waveBuffer) {
    nowBuffering[i] = waveBuffer[i] * nextDatum;  // modulate amplitude
    
    if (i%chunkSize < 1 && modDataBuffer.length > 1) {
      nextDatum = modDataBuffer.shift();
    }
  }

  return nowBuffering;
}

function modFreq() {
  // values between -1.0 and 1.0
  var nowBuffering = arrayBuffer.getChannelData(0);

  var chunkSize = frameCount/modDataBuffer.length;
  for (var i in modDataBuffer) {
    var waveBuffer = makeWave(waveType, 440/modDataBuffer[i], frameCount);
    for (var j = 0; j < chunkSize; j++) {
      var nbi = parseInt((chunkSize*i) + j);
      nowBuffering[nbi] = waveBuffer[j];
    }
  }
  modDataBuffer.length = 0;

  return nowBuffering;
}

// e.g. beep(500, 2000, 1, 'sine', function() {} );
function beep(duration, frequency, volume, type, callback) {
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.value = volume;
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  oscillator.onended = callback;

  oscillator.start();
  setTimeout(function(){ oscillator.stop(); }, duration);
}

// VISUALIZATION
function draw(plotData, elementName) {
  var canvas = document.getElementById(elementName);
  var ctx = canvas.getContext('2d');
  var height = canvas.height;
  var width = canvas.width;

  ctx.clearRect(0, 0, width, height); // clear canvas

  ctx.beginPath();
  ctx.moveTo(0, height/2 - plotData[0]*height/2);

  var x = 0;
  var y = 0;
  for(var i in plotData) {
    y = plotData[i];
    ctx.lineTo(x, height/2 - y*height/2);
    x += width/(plotData.length-1.0);
  }

  ctx.stroke();
  ctx.closePath();
}

