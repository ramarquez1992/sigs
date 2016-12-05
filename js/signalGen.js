var maxFreq = 4500;  // TODO: set systematically

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

function sawData( freq, numPoints ) {
	var dataArray = [];
	for ( var i = 0; i < numPoints; i++ ) {
		dataArray.push(
			2 * ( ( i * freq / numPoints ) - Math.floor( i * freq / numPoints ) ) - 1
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
  freq = Math.min(freq, maxFreq);  // Limit in freq to avoid infinity

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
	default:
		returnData = null;
	}

	return returnData;
}

function makeCleanWave( type, freq, resolution ) {
  var dirty = makeWave(type, freq, resolution);
  return cleanWave(dirty);
}

// Return a single wave that starts and ends at zero
// TODO: cleaning waves in this fashion makes saw act weird
function cleanWave(returnData) {
  var count = 0;

  while (returnData[count] >= 0) {
    count++;
  }

  while(returnData[count] <= 0) {
    count++;
  }

  var cleanData = returnData.slice(0, count);
  return cleanData;
}

