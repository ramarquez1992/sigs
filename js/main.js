// GENERAL INIT
var socket = io.connect('http://localhost:8080');
var modType = 'amp';
var waveType = 'sine';
var defaultTone = 440;  // Hz (concert A)
var baseTone = defaultTone;
var notes;

$(document).ready(function() {
  // Remember this is called asynchronously
  $.getJSON( '/js/notes.json', function( data ) {
    notes = data;
    setTone('C');
  });

  initSocket();
  initGUI();
});

function initSocket() {
  socket.emit('clrBuffer', null);
  socket.on('newDataRcvd', newDataRcvd);
}

function initGUI() {
  $('#stopButton').hide();

  // Associate buttons w/ corresponding funcs
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

  $('#pitchSelect').find('button').each(function() {
    this.onclick = function() {
      baseTone = notes[4][this.value];
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

function setTone(note) {
  baseTone = notes[4][note];
}


// BUFFERS
var modDataBuffer = [];
var frameBuffer = [];

var bufferResetTimer;
var bufferResetInterval = 1000;

// Clear old data occasionally to prevent latency woes
// ^^ Only necessary for sq because of its current lack of MFSK
function resetBuffers() {
  modDataBuffer.length = 0;
  frameBuffer.length = 0;
}

function newDataRcvd(inBuffer) {
  if (!playing) return;

  // Being called asynchronously, so push rather than concat (may not matter...)
  for (var i in inBuffer) {
    modDataBuffer.push(inBuffer[i]);
  }
}

function bufferWaves(modData) {
  switch (modType) {
    case 'freq':
      var freqSet = [];
      for (var i = 0; i < modDataBuffer.length; i++) {
        freqSet.push(baseTone / modData[i]);
      }

      frameBuffer = frameBuffer.concat(mfsk(freqSet, sampleRate, waveType, frameSize, frameBuffer.slice()));
      break;

    case 'amp': /* falls through */
    case 'none': /* falls through */
    default:
      while (frameBuffer.length < frameSize) {
        frameBuffer = frameBuffer.concat(makeWave(waveType, baseTone, sampleRate));
      }
      break;
  }
}

function fillBuffer(dest, source) {
  for (var i in dest) {
    dest[i] = source[i];
  }
}


// AUDIO SETUP
var audioCtx = getAudioCtx();

var channels = 1;  // mono
var sampleRate = audioCtx.sampleRate;  // typically 44.1k
var frameSize = 1024;  // use factor of sample rate??? (e.g. 1050)

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

  var modData = modDataBuffer.slice();
  // Leave at least 1 in modDataBuffer to account for input lag
  modDataBuffer.splice(0, modDataBuffer.length-1);

  bufferWaves(modData);

  var nextFrame = frameBuffer.slice(0, frameSize);

  // Leave some data in frameBuffer so freq modding can
  // properly translate during MFSK
  var frameOffset = (modType === 'freq' ? 2 : 0);
  frameBuffer.splice(0, frameSize - frameOffset);

  var moddedFrame = [];

  // Modulate
  switch (modType) {
    case 'amp':
      moddedFrame = modAmp(nextFrame, modData);
      break;
    case 'freq':
      // Already modded in bufferWaves w/ MFSK
      moddedFrame = nextFrame;
      break;
    case 'none': /* falls through */
    default:
      moddedFrame = noMod(nextFrame);
      break;
  }

  fillBuffer(sourceBuffer.getChannelData(0), moddedFrame);
  source.start();
}

function startSound() {
  playing = true;
  resetBuffers();

  playSound();

  bufferResetTimer = window.setInterval(function() {
    if (waveType === 'square') {
      resetBuffers();
    }
  }, bufferResetInterval);
  drawTimer = window.setInterval(updateVisualization, drawInterval);
}

function stopSound() {
  playing = false;

  clearInterval(bufferResetTimer);
  clearInterval(drawTimer);
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
var drawFrameScaleFactor = 8;  // shows only the first 8th of the frame
var drawTimer;
var drawInterval = ((frameSize / sampleRate) * 1000);  // redraws every frame

function updateVisualization() {
  var outBuffer = sourceBuffer.getChannelData(0);

  // Trim number of points that will be drawn
  var drawBuffer = [];
  for (var i = 0; i < outBuffer.length/drawFrameScaleFactor; i ++) {
    drawBuffer.push(outBuffer[i]);
  }
  draw(drawBuffer, 0, 'timeDomainCanvas');
}
