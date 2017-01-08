function noMod( inFrame ) {
	return inFrame.slice();
}

function modAmp( inFrame, modData ) {
	let modulatedBuffer = [];
	const chunkSize = inFrame.length / modData.length;

	let nextDatum = modData[ 0 ];
	for ( let i in inFrame ) {
		modulatedBuffer[ i ] = inFrame[ i ] * nextDatum; // Modulate amplitude

		// Get next mod datum if switching to next chunk
		if ( i % chunkSize < 1 && modData.length > i ) {
			nextDatum = modData[ i ];
		}
	}

	return modulatedBuffer;
}

// Returns new frame full of different [matched] freqs
// that starts at the end of prevFrame
function mfsk( freqSet, sampleRate, waveType, frameSize, prevFrame ) {
	const numChunks = freqSet.length;
	const chunkSize = parseInt( frameSize / numChunks );
	let outBuffer = [];

	// Fill the outBuffer w/ numChunks # of chunks
	for ( let i = 0; i < numChunks; i++ ) {

		let curWave = makeWave( waveType, freqSet[ i ], sampleRate );

		// If frameBuffer has contents translate the new chunk to match the end of the current frameBuffer
		if ( prevFrame.length < 2 ) {
			let translatedWave = curWave;
		}
		else {
			let matchBuffer = ( i === 0 ? prevFrame : outBuffer );
			let translatedWave = translate( matchBuffer, curWave );
		}


		let curWaveSize = translatedWave.length; // How big is this single wave
		let curChunkCnt = Math.ceil( chunkSize / curWaveSize ); // How many waves to fill a chunk

		let waveChunkBuffer = [];
		for ( let k = 0; k < curChunkCnt; k++ ) {
			waveChunkBuffer = waveChunkBuffer.concat( translatedWave );
		}

		// TODO: lets square overshoot its chunk to avoid having to translate w/ no reference to phase
		if ( waveType !== 'square' ) {
			waveChunkBuffer = waveChunkBuffer.splice( 0, chunkSize );
		}

		outBuffer = outBuffer.concat( waveChunkBuffer );
	}

	return outBuffer;
}

// Returns a copy of inWave that has been translated to match baseWave
// baseWave needs at least 2 points
function translate( baseWave, inWave ) {
	// Don't try translating if baseWave is empty
	if ( baseWave.length < 2 ) {
		return inWave.slice();
	}

	// Find point where inWave should start to match baseWave
	// TODO: calculate start point using instantaneous phase

	// Translate based on last couple values of baseWave
	const firstSample = baseWave[ baseWave.length - 2 ];
	const lastSample = baseWave[ baseWave.length - 1 ];

	let startPoint = 0;
	const goingUp = firstSample < lastSample;

	if ( goingUp && lastSample >= 0 ) { // 0-90 deg
		while ( inWave[ startPoint ] <= lastSample ) {
			startPoint++;
		}
	}
	else if ( goingUp && lastSample < 0 ) { // 270-360 deg
		// start at the end and decrease until less than
		startPoint = inWave.length - 1;
		while ( inWave[ startPoint ] > lastSample ) {
			startPoint--;
		}
		startPoint++;
	}
	else { // 90-270 deg
		while ( inWave[ startPoint ] <= 0.99 ) {
			startPoint++;
		}
		while ( inWave[ startPoint ] >= lastSample ) {
			startPoint++;
		}
	}

	// Splitting at startPoint, rearrange inWave
	let translatedWave = [];
	for ( let j = startPoint; j < inWave.length; j++ ) {
		translatedWave.push( inWave[ j ] );
	}
	for ( let j = 0; j < startPoint; j++ ) {
		translatedWave.push( inWave[ j ] );
	}

	return translatedWave;
}
