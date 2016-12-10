var maxFreq = 4500; // TODO: set systematically

function integrate( f, start, end, step ) {
	var total = 0;
	step = step || 0.01;
	for ( var x = start; x < end; x += step ) {
		total += f( x + step / 2 ) * step;
	}
	return total;
}

function sineData( freq, numPoints ) {
	var dataArray = [];
	for ( var i = 0; i < numPoints; i++ ) {
		dataArray.push( Math.sin( ( 2 * Math.PI / numPoints ) * freq * i ) );
	}
	return dataArray;
}

function squareData( freq, numPoints ) {
	var dataArray = sineData( freq, numPoints );
	for ( var i = 0; i < dataArray.length; i++ ) {
		dataArray[ i ] = Math.sign( dataArray[ i ] );
	}
	return dataArray;
}

function triData( freq, numPoints ) {
	var dataArray = [];
	for ( var i = 0; i < numPoints; i++ ) {
		dataArray.push(
			( 2 / Math.PI ) * Math.asin( Math.sin( 2 * Math.PI * freq * i / numPoints ) )
		);
	}
	return dataArray;
}

function sawData( freq, numPoints ) {
	var dataArray = [];
	for ( var i = 0; i < numPoints; i++ ) {
		dataArray.push(
			2 * ( freq * ( i / numPoints ) % 1 ) - 1
		);
	}
	return dataArray;
}


function addWaves() {
	var finalWave = [];
	finalWave.push( arguments[ 1 ] );
	for ( var i = 1; i < arguments.length; i++ ) {
		finalWave += arguments[ i ];
	}
	finalWave.map( function ( x ) {
		return ( x / arguments.length );
	} );
	return finalWave;
}


function makeWave( type, freq, resolution ) {
	freq = Math.min( freq, maxFreq ); // Limit in freq to avoid infinity

	var returnData = [];
	switch ( type ) {
	case 'sine':
		returnData = sineData( freq, resolution );
		break;
	case 'square':
		returnData = squareData( freq, resolution );
		break;
	case 'saw':
		returnData = sawData( freq, resolution );
		break;
	case 'tri':
		returnData = triData( freq, resolution );
		break;
	default:
		returnData = null;
	}

	return returnData;
}

function makeCleanWave( type, freq, resolution ) {
	var dirty = makeWave( type, freq, resolution );
	return cleanWave( dirty, type );
}

// Return a single wave that starts and ends at zero
function cleanWave( inWave, type ) {
  var count = 0;

  if ( type === 'saw' ) {
    while ( inWave[ count] <= 0.98 ) {
      count++;
    }
  } else {
    while ( inWave[ count ] >= 0 ) {
      count++;
    }

    while ( inWave[ count ] <= 0 ) {
      count++;
    }
  }

  var cleanData = inWave.slice( 0, count );
	if ( type === 'square' ) cleanData.splice(0, 1);

	return cleanData;
}

function mfsk(freqSet, frameSize) {
	//return full frame appropriately modded
}

// Returns a copy of inWave that has been translated to match baseWave
// baseWave needs at least 2 points
function translate(baseWave, inWave) {
	// Don't try translating if baseWave is empty
	if (baseWave.length < 2) {
		return inWave;
	}

	var translatedWave = [];

	// Translate based on last couple values of baseWave
	var firstSample = baseWave[baseWave.length - 2];
	var lastSample = baseWave[baseWave.length - 1];

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
}
