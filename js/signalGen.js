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
  return cleanData;
}
