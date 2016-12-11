function noMod(inFrame) {
  return inFrame.slice();
}

function modAmp(inFrame, modData) {
  var modulatedBuffer = [];
  var chunkSize = inFrame.length/modData.length;

  var nextDatum = modData[0];
  for (var i in inFrame) {
    modulatedBuffer[i] = inFrame[i] * nextDatum;  // Modulate amplitude

    // Get next mod datum if switching to next chunk
    if (i%chunkSize < 1 && modData.length > i) {
      nextDatum = modData[i];
    }
  }

  return modulatedBuffer;
}

// Returns new frame full of different [matched] freqs
// that starts at the end of prevFrame
function mfsk(freqSet, sampleRate, waveType, frameSize, prevFrame) {
  var numChunks = freqSet.length;
  var chunkSize = parseInt(frameSize / numChunks);
  var outBuffer = [];

  // Fill the outBuffer w/ numChunks # of chunks
  for (var i = 0; i < numChunks; i++) {

    var curWave = makeWave(waveType, freqSet[i], sampleRate);

    // If frameBuffer has contents translate the new chunk to match the end of the current frameBuffer
    var translatedWave;
    if (prevFrame.length < 2) {
      translatedWave = curWave;
    } else {
      var matchBuffer = (i === 0 ? prevFrame : outBuffer);
      translatedWave = translate(matchBuffer, curWave);
    }


    var curWaveSize = translatedWave.length;  // How big is this single wave
    var curChunkCnt = Math.ceil(chunkSize / curWaveSize);  // How many waves to fill a chunk

    var waveChunkBuffer = [];
    for (var k = 0; k < curChunkCnt; k++) {
      waveChunkBuffer = waveChunkBuffer.concat(translatedWave);
    }

    // TODO: lets square overshoot its chunk to avoid having to translate w/ no reference to phase
    if (waveType !== 'square') {
      waveChunkBuffer = waveChunkBuffer.splice(0, chunkSize);
    }

    outBuffer = outBuffer.concat(waveChunkBuffer);
  }

  return outBuffer;
}

// Returns a copy of inWave that has been translated to match baseWave
// baseWave needs at least 2 points
function translate(baseWave, inWave) {
  // Don't try translating if baseWave is empty
  if (baseWave.length < 2) {
    return inWave.slice();
  }

  // Find point where inWave should start to match baseWave
  // TODO: calculate start point using instantaneous phase

  // Translate based on last couple values of baseWave
  var firstSample = baseWave[baseWave.length - 2];
  var lastSample = baseWave[baseWave.length - 1];

  var startPoint = 0;
  var goingUp = firstSample < lastSample;

  if (goingUp && lastSample >= 0) {  // 0-90 deg
    while (inWave[startPoint] <= lastSample) {
      startPoint++;
    }
  } else if (goingUp && lastSample < 0) {  // 270-360 deg
    // start at the end and decrease until less than
    startPoint = inWave.length - 1;
    while (inWave[startPoint] > lastSample) {
      startPoint--;
    }
    startPoint++;
  } else {  // 90-270 deg
    while (inWave[startPoint] <= 0.99) {
      startPoint++;
    }
    while (inWave[startPoint] >= lastSample) {
      startPoint++;
    }
  }

  // Splitting at startPoint, rearrange inWave
  var translatedWave = [];
  for (var j = startPoint; j < inWave.length; j++) {
    translatedWave.push(inWave[j]);
  }
  for (j = 0; j < startPoint; j++) {
    translatedWave.push(inWave[j]);
  }

  return translatedWave;
}
