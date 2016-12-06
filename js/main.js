// GENERAL INIT
var socket = io.connect('http://localhost:8080');
var modType = 'none';
var waveType = 'sine';
var defaultTone = 440;  // Hz (concert A)
var baseTone = defaultTone;

$(document).ready(function() {
  initGUI();

  initSocket();
  socket.emit('clrBuffer', null);
});

function initGUI() {
  $('#stopButton').hide();

  $('#waveTypeSelect').children().each(function() {
    this.onclick = function() {
      setWaveType(this.value);
    };
  });

  $('#modTypeSelect').children().each(function() {
    this.onclick = function() {
      setModType(this.value);
    };
  });
}

function setWaveType(inWaveType) {
  waveType = inWaveType;
  waveBuffer = [];
}

function setModType(inModType) {
  modType = inModType;
  waveBuffer = [];
}

function startButtonPressed() {
  startSound();
  $('#startButton').hide();
  $('#stopButton').show();
}

function stopButtonPressed() {
  stopSound();
  $('#startButton').show();
  $('#stopButton').hide();
}

function initSocket() {
  socket.on('newDataRcvd', newDataRcvd);
}

// IN MODULATION DATA
var modDataBuffer = [];
function newDataRcvd(inBuffer) {
  for (var i in inBuffer) {
    modDataBuffer.push(inBuffer[i]);
  }
}

// AUDIO INIT
var audioCtx;
if (window.AudioContext) audioCtx = new window.AudioContext();
else if (window.webkitAudioContext) audioCtx = new window.webkitAudioContext();
else if (window.audioContext) audioCtx = new window.audioContext();
else alert('Browser audio requirements not met');

var channels = 1;
var sampleRate = audioCtx.sampleRate;
var frameSize = 1024;
var sourceBuffer = audioCtx.createBuffer(channels, frameSize, sampleRate);

var source;
var timer;
//var timerInterval = (frameSize / sampleRate);  // 50 works
var timerInterval = 50;
var drawPoints = 200;

var playing = false;
function createSource() {
  source = audioCtx.createBufferSource();
  source.loop = false;
  source.buffer = sourceBuffer;
  source.connect(audioCtx.destination);
  modAmp();
  source.onended = function() {
    if (playing) createSource();
  };
  source.start();
}

function startSound() {
  playing = true;
  modDataBuffer.length = 0;  // clear old data

  createSource();
  /*source = audioCtx.createBufferSource();
  source.loop = true;
  source.buffer = sourceBuffer;
  source.connect(audioCtx.destination);
  source.onended = function() { console.log('ended'); };
  source.start();*/

  /*var nowBuffering = sourceBuffer.getChannelData(0);
  waveBuffer = makeWave(waveType, baseTone, sampleRate);
  var frameBuffer = waveBuffer.slice(0, frameSize);
  for (var i in frameBuffer) {
    nowBuffering[i] = frameBuffer[i];
  }*/

  timer = window.setInterval(function() {
    switch (modType) {
      case 'none':
        //noMod();
        break;
      case 'amp':
        modAmp();
        break;
      case 'freq':
        modFreq();
        break;
      default:
        console.log('Unknown modulation type');
    }

    var outBuffer = sourceBuffer.getChannelData(0);

    // Trim number of points that will be drawn
    var drawBuffer = [];
    var drawInterval = parseInt(outBuffer.length/drawPoints);
    for (var i = 0; i < outBuffer.length; i += drawInterval) {
      drawBuffer.push(outBuffer[i]);
    }
    draw(drawBuffer, 0, 'timeDomainCanvas');

  }, timerInterval);
}

function stopSound() {
  //source.stop();
  playing = false;
  clearInterval(timer);
}

var waveBuffer = [];
function noMod() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  while (waveBuffer.length < frameSize) {
    //waveBuffer = waveBuffer.concat( makeCleanWave(waveType, baseTone, sampleRate) );
    waveBuffer = waveBuffer.concat( makeWave(waveType, baseTone, sampleRate) );
  }
  var frameBuffer = waveBuffer.splice(0, frameSize);

  for (var i in frameBuffer) {
    nowBuffering[i] = frameBuffer[i];
  }

  return nowBuffering;
}

function modAmp() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  //waveBuffer = makeWave(waveType, baseTone, sampleRate);
  //console.log(waveBuffer);
  while (waveBuffer.length < frameSize) {
    waveBuffer = waveBuffer.concat( makeWave(waveType, baseTone, sampleRate) );
  }
  var frameBuffer = waveBuffer.splice(0, frameSize);

  var chunkSize = frameSize/modDataBuffer.length;

  var nextDatum = modDataBuffer[0];
  for (var i in frameBuffer) {
    nowBuffering[i] = frameBuffer[i] * nextDatum;  // modulate amplitude

    if (i%chunkSize < 1 && modDataBuffer.length > 1) {
      nextDatum = modDataBuffer.shift();
    }
  }

  return nowBuffering;
}

function modFreq() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  var numChunks = modDataBuffer.length;
  if (numChunks !== 0) {
    for (var i = 0; i < numChunks; i++) {
      waveBuffer.push( makeCleanWave(waveType, baseTone/modDataBuffer.shift(), sampleRate) );
    }
  } else { numChunks = 1; }

  var chunkSize = frameSize/numChunks;
  var frameBuffer = [];

  for (var k = 0; k < numChunks; k++) {
    var curChunkSize = waveBuffer[k].length; // how big is this single wave
    var curChunkCnt = Math.ceil(chunkSize/curChunkSize);  // how many waves to fill a chunk
    for (var n = 0; n < curChunkCnt; n++) {
      frameBuffer = frameBuffer.concat(waveBuffer[k]);
    }

    // Always keep at least 1 user input
    if (waveBuffer.length > 1) waveBuffer.shift();
  }

  frameBuffer.length = frameSize;
  for (var j in frameBuffer) {
    nowBuffering[j] = frameBuffer[j];
  }

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
function draw(plotData, deltaY, elementName) {
  var newData = [];

  for (var i = 0; i < plotData.length - 1; i++){
    if (Math.abs(plotData[i+1] - plotData[i]) >= deltaY){
      newData.push(plotData[i+1]);
    }
  }

  var canvas = document.getElementById(elementName);
  var ctx = canvas.getContext('2d');
  var height = canvas.height;
  var width = canvas.width;

  ctx.clearRect(0,0,width,height);  // clear canvas
  ctx.beginPath();
  ctx.moveTo(0,height/2 - newData[0]*height/2);

  var x = 0;
  var y = 0;
  for(var j in newData) {
    y = newData[j];
    ctx.lineTo(x, height/2 - y*height/2);
    x += width/(newData.length-1.0);
  }

  ctx.stroke();
  ctx.closePath();
}

