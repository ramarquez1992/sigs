// GENERAL INIT
var socket = io.connect('http://localhost:8080');
var modType = 'amp';
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

var waveBuffer = [];
var smallWaveBuffer = [];


// IN MODULATION DATA
var modDataBuffer = [];
function newDataRcvd(inBuffer) {
  if (!playing) return;

  for (var i in inBuffer) {
    modDataBuffer.push(inBuffer[i]);

    if (modType === 'freq') {
      smallWaveBuffer.push(makeCleanWave(waveType, (baseTone / modDataBuffer.shift()), sampleRate));

    } else {
      while (waveBuffer.length < frameSize) {
        waveBuffer = waveBuffer.concat( makeWave(waveType, baseTone, sampleRate) );
      }
    }
  }

  //console.log(smallWaveBuffer[0]);
}

// AUDIO INIT
var audioCtx;
if (window.AudioContext) audioCtx = new window.AudioContext();
else if (window.webkitAudioContext) audioCtx = new window.webkitAudioContext();
else if (window.audioContext) audioCtx = new window.audioContext();
else alert('Browser audio requirements not met');

var channels = 1;
var sampleRate = audioCtx.sampleRate;
//var frameSize = 1050;  // ??? factor of sample rate so freq modding fits nicely
var frameSize = 1024;
//var frameSize = 512;
//var frameSize = 4096;
var sourceBuffer = audioCtx.createBuffer(channels, frameSize, sampleRate);

var source;
var timer;
//var timerInterval = (frameSize / sampleRate);  // 50 works
var timerInterval = 50;
var drawPoints = 300;

var playing = false;
function playSound() {
  // Init buffer source
  source = audioCtx.createBufferSource();
  source.loop = false;
  source.buffer = sourceBuffer;
  source.connect(audioCtx.destination);
  source.onended = function() {
    if (playing) playSound();
  };

  // Modulate
  switch (modType) {
    case 'none':
      noMod();
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

  source.start();
}

var bufferResetTimer;

function startSound() {
  playing = true;
  modDataBuffer.length = 0;  // clear old data
  waveBuffer.length = 0;
  smallWaveBuffer.length = 0;

  playSound();

  bufferResetTimer = window.setInterval(function() {
    modDataBuffer.length = 0;  // clear old data
    waveBuffer.length = 0;
    smallWaveBuffer.length = 0;

  }, 2000);

  timer = window.setInterval(function() {
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
  playing = false;
  clearInterval(timer);
  clearInterval(bufferResetTimer);
}

function noMod() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  while (waveBuffer.length < frameSize) {
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

  //makeWave(waveType, baseTone, sampleRate);

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
  //var numChunks = smallWaveBuffer.length;
  if (numChunks === 0) numChunks = 1;

  var chunkSize = frameSize/numChunks;
  var frameBuffer = [];

  for (var k = 0; k < numChunks && smallWaveBuffer.length > 0; k++) {
    var curChunkSize = smallWaveBuffer[0].length; // how big is this single wave
    var curChunkCnt = Math.ceil(chunkSize/curChunkSize);  // how many waves to fill a chunk

    var translatedWave = [];
    if (waveBuffer.length > 1) {  // dont try translating if wavebuffer is empty
      // before you create the chunk, translate the small wave based on the
      // last couple values of the wavebuffer
      var firstSample = waveBuffer[waveBuffer.length-2];
      var lastSample = waveBuffer[waveBuffer.length-1];

      var goingUp = (firstSample < lastSample ? true : false);
      var startPoint = 0;
      if (goingUp && lastSample >= 0) {
        while (smallWaveBuffer[0][startPoint] < lastSample) {
          startPoint++;
        }
      } else if (goingUp && lastSample < 0) {
        // start at the end and decrease until less than
        startPoint = smallWaveBuffer[0].length - 1;
        while (smallWaveBuffer[0][startPoint] > lastSample) {
          startPoint--;
        }
      } else { // going down
        while (smallWaveBuffer[0][startPoint] < 0.98) {
          startPoint++;
        }
        while (smallWaveBuffer[0][startPoint] > lastSample) {
          startPoint++;
        }
      }

      for (var m = startPoint; m < smallWaveBuffer[0].length; m++) {
        translatedWave.push(smallWaveBuffer[0][m]);
      }
      for (m = 0; m < startPoint; m++) {
        translatedWave.push(smallWaveBuffer[0][m]);
      }

      //smallWaveBuffer[0] = translatedWave.slice();
    } else {
      translatedWave = smallWaveBuffer[0].slice();
    }
    translatedWave = smallWaveBuffer[0].slice();


    //console.log(translatedWave);
    var waveChunkBuffer = [];
    for (var n = 0; n < curChunkCnt; n++) {
      //waveChunkBuffer = waveChunkBuffer.concat(smallWaveBuffer[0]);
      waveChunkBuffer = waveChunkBuffer.concat(translatedWave);
    }
    //console.log(waveChunkBuffer);
    waveBuffer = waveBuffer.concat(waveChunkBuffer);

    // Always keep at least 1 user input
    if (smallWaveBuffer.length > 1) smallWaveBuffer.shift();
  }

  frameBuffer = waveBuffer.splice(0, frameSize);

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

