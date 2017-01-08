// GENERAL INIT
const socket = io.connect( 'http://localhost:8080' );

let modType = 'amp';
let waveType = 'sine';

let defaultPitch = 440;
let defaultNote = 'C';
let defaultOctave = 4;
let baseNote = defaultNote;
let baseOctave = defaultOctave;

$( document ).ready( function () {
	// Remember this is called asynchronously
	$.getJSON( '/js/notes.json', function ( data ) {
		const notes = data;
		setNote( defaultNote, defaultOctave );
	} );

	initSocket();
	initGUI();
} );

function initSocket() {
	socket.emit( 'clrBuffer', null );
	socket.on( 'newDataRcvd', newDataRcvd );
}

function initGUI() {
	$( '#stopButton' ).hide();

	// Associate buttons w/ corresponding funcs
	$( '#waveTypeSelect' ).children().each( function () {
		this.onclick = function () {
			setWaveType( this.value );
		};
	} );

	$( '#modTypeSelect' ).children().each( function () {
		this.onclick = function () {
			setModType( this.value );
		};
	} );

	$( '#noteSelect' ).find( 'button' ).each( function () {
		this.onclick = function () {
			setNote( this.value, baseOctave );
		};
	} );

	$( '#octaveSelect' ).find( 'a' ).each( function () {
		this.onclick = function () {
			let newOctave = baseOctave;

			if ( this.classList.contains( 'prev' ) ) {
				newOctave = Number( baseOctave ) - 1;
			}
			else if ( this.classList.contains( 'next' ) ) {
				newOctave = Number( baseOctave ) + 1;
			}
			else {
				newOctave = this.innerHTML;
			}

			if ( newOctave < 0 || newOctave > 8 ) {
				newOctave = baseOctave;
			}

			setNote( baseNote, newOctave );
		};
	} );
}

function getPitch() {
	if ( notes ) {
		return notes[ baseOctave ][ baseNote ];
	}
	else {
		return defaultPitch;
	}
}

function startButtonPressed() {
	startSound();

	$( '#startButton' ).hide();
	$( '#stopButton' ).show();
}

function stopButtonPressed() {
	stopSound();

	$( '#startButton' ).show();
	$( '#stopButton' ).hide();
}

function setWaveType( inWaveType ) {
	$( '#waveTypeSelect button[value=' + waveType + ']' ).removeClass( 'active' );
	$( '#waveTypeSelect button[value=' + inWaveType + ']' ).addClass( 'active' );

	waveType = inWaveType;
	frameBuffer = [];
}

function setModType( inModType ) {
	$( '#modTypeSelect button[value=' + modType + ']' ).removeClass( 'active' );
	$( '#modTypeSelect button[value=' + inModType + ']' ).addClass( 'active' );

	modType = inModType;
	frameBuffer = [];
}

function setNote( inNote, inOctave ) {
	$( '#noteSelect button[value=' + baseNote + ']' ).removeClass( 'active' );
	$( '#noteSelect button[value=' + inNote + ']' ).addClass( 'active' );

	$( '#octaveSelect' ).find( '.active' ).first().removeClass( 'active' );
	$( '#octaveSelect' ).find( '.' + inOctave ).parent().addClass( 'active' );

	baseNote = inNote;
	baseOctave = inOctave;
}


// BUFFERS
let modDataBuffer = [];
let frameBuffer = [];

let bufferResetTimer;
const bufferResetInterval = 1000;

// Clear old data occasionally to prevent latency woes
// ^^ Only necessary for sq because of its current lack of MFSK
function resetBuffers() {
	modDataBuffer.length = 0;
	frameBuffer.length = 0;
}

function newDataRcvd( inBuffer ) {
	if ( !playing ) return;

	// Being called asynchronously, so push rather than concat (may not matter...)
	for ( let i in inBuffer ) {
		modDataBuffer.push( inBuffer[ i ] );
	}
}

function bufferWaves( modData ) {
	switch ( modType ) {
	case 'freq':
		let freqSet = [];
		for ( let i = 0; i < modDataBuffer.length; i++ ) {
			freqSet.push( getPitch() / modData[ i ] );
		}

		frameBuffer = frameBuffer.concat( mfsk( freqSet, sampleRate, waveType, frameSize, frameBuffer.slice() ) );
		break;

	case 'amp':
		/* falls through */
	case 'none':
		/* falls through */
	default:
		while ( frameBuffer.length < frameSize ) {
			frameBuffer = frameBuffer.concat( makeWave( waveType, getPitch(), sampleRate ) );
		}
		break;
	}
}

function fillBuffer( dest, source ) {
	for ( let i in dest ) {
		dest[ i ] = source[ i ];
	}
}


// AUDIO SETUP
let audioCtx = getAudioCtx();

const channels = 1; // mono
let sampleRate = audioCtx.sampleRate; // typically 44.1k
let frameSize = 1024; // use factor of sample rate??? (e.g. 1050)

let sourceBuffer = audioCtx.createBuffer( channels, frameSize, sampleRate );
let source;

let playing = false;

function playSound() {
	// Init buffer source
	source = audioCtx.createBufferSource();
	source.loop = false;
	source.buffer = sourceBuffer;
	source.connect( audioCtx.destination );
	source.onended = function () {
		if ( playing ) playSound();
	};

	let modData = modDataBuffer.slice();
	// Leave at least 1 in modDataBuffer to account for input lag
	modDataBuffer.splice( 0, modDataBuffer.length - 1 );

	bufferWaves( modData );

	let nextFrame = frameBuffer.slice( 0, frameSize );

	// Leave some data in frameBuffer so freq modding can
	// properly translate during MFSK
	let frameOffset = ( modType === 'freq' ? 2 : 0 );
	frameBuffer.splice( 0, frameSize - frameOffset );

	let moddedFrame = [];

	// Modulate
	switch ( modType ) {
	case 'amp':
		moddedFrame = modAmp( nextFrame, modData );
		break;
	case 'freq':
		// Already modded in bufferWaves w/ MFSK
		moddedFrame = nextFrame;
		break;
	case 'none':
		/* falls through */
	default:
		moddedFrame = noMod( nextFrame );
		break;
	}

	fillBuffer( sourceBuffer.getChannelData( 0 ), moddedFrame );
	source.start();
}

function startSound() {
	playing = true;
	resetBuffers();

	playSound();

	bufferResetTimer = window.setInterval( function () {
		if ( waveType === 'square' ) {
			resetBuffers();
		}
	}, bufferResetInterval );
	drawTimer = window.setInterval( updateVisualization, drawInterval );
}

function stopSound() {
	playing = false;

	clearInterval( bufferResetTimer );
	clearInterval( drawTimer );
}


// MISC AUDIO FUNCS
function getAudioCtx() {
	if ( window.AudioContext ) return new window.AudioContext();
	else if ( window.webkitAudioContext ) return new window.webkitAudioContext();
	else if ( window.audioContext ) return new window.audioContext();
	else alert( 'Browser audio requirements not met' );
}

// e.g. beep(500, 2000, 1, 'sine', function() {} );
function beep( duration, frequency, volume, type, callback ) {
	let oscillator = audioCtx.createOscillator();
	let gainNode = audioCtx.createGain();

	oscillator.connect( gainNode );
	gainNode.connect( audioCtx.destination );

	gainNode.gain.value = volume;
	oscillator.frequency.value = frequency;
	oscillator.type = type;
	oscillator.onended = callback;

	oscillator.start();
	setTimeout( function () {
		oscillator.stop();
	}, duration );
}


// VISUALIZATION
const drawFrameScaleFactor = 8; // shows only the first 8th of the frame
let drawTimer;
const drawInterval = ( ( frameSize / sampleRate ) * 1000 ); // redraws every frame

function updateVisualization() {
	let outBuffer = sourceBuffer.getChannelData( 0 );

	// Trim number of points that will be drawn
	let drawBuffer = [];
	for ( let i = 0; i < outBuffer.length / drawFrameScaleFactor; i++ ) {
		drawBuffer.push( outBuffer[ i ] );
	}
	draw( drawBuffer, 0, 'timeDomainCanvas' );
}
