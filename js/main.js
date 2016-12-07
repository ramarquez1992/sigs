// GENERAL INIT
var socket = io.connect('http://localhost:8080');
var modType = 'amp';
var waveType = 'sine';
var defaultTone = 440;  // Hz (concert A)
var baseTone = defaultTone;

$(document).ready(function() {
  initSocket();
  initGUI();
});

function initSocket() {
  socket.emit('clrBuffer', null);
  socket.on('newDataRcvd', newDataRcvd);
}

function initGUI() {
  $('#stopButton').hide();

  // Associate wave type buttons w/ corresponding funcs
  $('#waveTypeSelect').children().each(function() {
    this.onclick = function() {
      setWaveType(this.value);
    };
  });

  // Associate mod type buttons w/ corresponding funcs
  $('#modTypeSelect').children().each(function() {
    this.onclick = function() {
      setModType(this.value);
    };
  });
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

function setWaveType(inWaveType) {
  waveType = inWaveType;
  frameBuffer = [];
}

function setModType(inModType) {
  modType = inModType;
  frameBuffer = [];
}


// BUFFERS
var modDataBuffer = [];
var frameBuffer = [];
var waveBuffer = [];  // 2d: holds individual waves of different freqs

var bufferResetTimer;
var bufferResetInterval = 1000;

// Clear old data occasionally to prevent latency woes
function resetBuffers() {
  modDataBuffer.length = 0;
  frameBuffer.length = 0;
  waveBuffer.length = 0;
}


// IN MODULATION DATA
function newDataRcvd(inBuffer) {
  if (!playing) return;

  // Being called asynchronously, so push rather than concat (may not matter...)
  for (var i in inBuffer) {
    modDataBuffer.push(inBuffer[i]);
  }

  bufferWaves();
}

function bufferWaves() {
  for (var i = 0; i < modDataBuffer.length; i++) {
    switch (modType) {
      case 'freq':
        waveBuffer.push(makeCleanWave(waveType, (baseTone / modDataBuffer.shift()), sampleRate));
        break;

      default:
        while (frameBuffer.length < frameSize) {
          frameBuffer = frameBuffer.concat(makeWave(waveType, baseTone, sampleRate));
        }
    }
  }
}


// AUDIO SETUP
var audioCtx = getAudioCtx();

var channels = 1;  // mono
var sampleRate = audioCtx.sampleRate;  // typically 44.1k
var frameSize = 512;  // use factor of sample rate??? (e.g. 1050)

var sourceBuffer = audioCtx.createBuffer(channels, frameSize, sampleRate);
var source;

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

  source.start();

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
}

function startSound() {
  playing = true;
  resetBuffers();

  playSound();

  bufferResetTimer = window.setInterval(resetBuffers, bufferResetInterval);
  drawTimer = window.setInterval(updateVisualization, drawInterval);
}

function stopSound() {
  playing = false;

  clearInterval(bufferResetTimer);
  clearInterval(drawTimer);
}


// MODULATION
function noMod() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  for (var i in nowBuffering) {
    nowBuffering[i] = frameBuffer.shift();
  }
}

function modAmp() {
  var nowBuffering = sourceBuffer.getChannelData(0);

  var chunkSize = frameSize/modDataBuffer.length;

  var nextDatum = modDataBuffer[0];
  for (var i in nowBuffering) {
    nowBuffering[i] = frameBuffer.shift() * nextDatum;  // Modulate amplitude

    // Leave at least 1 in modDataBuffer to account for input lag
    if (i%chunkSize < 1 && modDataBuffer.length > 1) {
      nextDatum = modDataBuffer.shift();
    }
  }
}

function modFreq() {
  var numChunks = (waveBuffer.length === 0 ? 1 : waveBuffer.length);
  var chunkSize = frameSize / numChunks;

  // Fill the frameBuffer w/ numChunks # of chunks
  for (var i = 0; i < numChunks && waveBuffer.length > 0; i++) {

    // If frameBuffer has contents translate the new chunk to match the end of the current frameBuffer
    var translatedWave = [];
    if (frameBuffer.length > 1) {  // Don't try translating if frameBuffer is empty
      // Before you create the chunk, translate the single wave based on the
      // last couple values of the frameBuffer
      var firstSample = frameBuffer[frameBuffer.length - 2];
      var lastSample = frameBuffer[frameBuffer.length - 1];

      var startPoint = 0;

      var goingUp = (firstSample < lastSample ? true : false);
      if (goingUp && lastSample >= 0) {
        while (waveBuffer[0][startPoint] <= lastSample) {
          startPoint++;
        }
      } else if (goingUp && lastSample < 0) {
        // start at the end and decrease until less than
        startPoint = waveBuffer[0].length - 1;
        while (waveBuffer[0][startPoint] >= lastSample) {
          startPoint--;
        }
      } else { // going down
        while (waveBuffer[0][startPoint] <= 0.98) {
          startPoint++;
        }
        while (waveBuffer[0][startPoint] >= lastSample) {
          startPoint++;
        }
      }


      for (var j = startPoint; j < waveBuffer[0].length; j++) {
        translatedWave.push(waveBuffer[0][j]);
      }
      for (j = 0; j < startPoint; j++) {
        translatedWave.push(waveBuffer[0][j]);
      }

    } else {
      translatedWave = waveBuffer[0].slice();
    }

    var curWaveSize = translatedWave.length;  // How big is this single wave
    var curChunkCnt = Math.ceil(chunkSize / curWaveSize);  // How many waves to fill a chunk

    var waveChunkBuffer = [];
    for (var k = 0; k < curChunkCnt; k++) {
      waveChunkBuffer = waveChunkBuffer.concat(translatedWave);
    }

    // Let square overshoot its chunk to avoid having to translate w/ no reference to phase
    if (waveType !== 'square') {
      waveChunkBuffer = waveChunkBuffer.splice(0, chunkSize);
    }

    frameBuffer = frameBuffer.concat(waveChunkBuffer);

    // Always keep at least 1 user input to account for input lag
    if (waveBuffer.length > 1) waveBuffer.shift();
  }

  var nowBuffering = sourceBuffer.getChannelData(0);
  for (i in nowBuffering) {
    // Keep at least 2 in frameBuffer MFSK translation has data to work from
    var nextSample = frameBuffer[0];
    if (frameBuffer.length > 2) frameBuffer.shift();

    nowBuffering[i] = nextSample;
  }

}


// MISC AUDIO FUNCS
function getAudioCtx() {
  if (window.AudioContext) return new window.AudioContext();
  else if (window.webkitAudioContext) return new window.webkitAudioContext();
  else if (window.audioContext) return new window.audioContext();
  else alert('Browser audio requirements not met');
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
var drawPoints = 500;
var drawTimer;
var drawInterval = 50; // use (frameSize / sampleRate) to redraw every frame

function updateVisualization() {
  var outBuffer = sourceBuffer.getChannelData(0);

  // Trim number of points that will be drawn
  var drawBuffer = [];
  var drawInterval = parseInt(outBuffer.length/drawPoints);
  for (var i = 0; i < outBuffer.length; i += drawInterval) {
    drawBuffer.push(outBuffer[i]);
  }
  draw(drawBuffer, 0, 'timeDomainCanvas');
}
