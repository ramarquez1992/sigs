var maxFreq = 4500; // TODO: set systematically

function integrate( f, start, end, step ) {
	var total = 0;
	step = step || 0.01;
	for ( var x = start; x < end; x += step ) {
		total += f( x + step / 2 ) * step;
	}
	return total;
}

function sineData( freq, sampleRate ) {
	var dataArray = [];
	var waveLength = Math.floor( sampleRate / freq );

	for ( var i = 0; i < Math.floor( waveLength ); i++ ) {
		dataArray.push( Math.sin( ( 2 * Math.PI / sampleRate ) * freq * i ) );
	}
	return dataArray;
}

function squareData( freq, sampleRate ) {
	var dataArray = sineData( freq, sampleRate );
	for ( var i = 0; i < dataArray.length; i++ ) {
		dataArray[ i ] = Math.sign( dataArray[ i ] );
	}
	return dataArray;
}

function triData( freq, sampleRate ) {
	var dataArray = [];
	var waveLength = Math.floor( sampleRate / freq );

	for ( var i = 0; i < waveLength; i++ ) {
		dataArray.push(
			( 2 / Math.PI ) * Math.asin( Math.sin( 2 * Math.PI * freq * i / sampleRate ) )
		);
	}
	return dataArray;
}

function sawData( freq, sampleRate ) {
	var dataArray = [];
	var waveLength = Math.floor( sampleRate / freq );

	for ( var i = 0; i < waveLength; i++ ) {
		dataArray.push(
			2 * ( freq * ( i / sampleRate ) % 1 ) - 1
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
