const maxFreq = 4500; // TODO: set systematically

function integrate( f, start, end, step ) {
	let total = 0;
	step = step || 0.01;
	for ( let x = start; x < end; x += step ) {
		total += f( x + step / 2 ) * step;
	}
	return total;
}

function sineData( freq, sampleRate ) {
	let dataArray = [];
	const waveLength = Math.floor( sampleRate / freq );

	for ( let i = 0; i < Math.floor( waveLength ); i++ ) {
		dataArray.push( Math.sin( ( 2 * Math.PI / sampleRate ) * freq * i ) );
	}
	return dataArray;
}

function squareData( freq, sampleRate ) {
	let dataArray = sineData( freq, sampleRate );
	for ( let i = 0; i < dataArray.length; i++ ) {
		dataArray[ i ] = Math.sign( dataArray[ i ] );
	}
	return dataArray;
}

function triData( freq, sampleRate ) {
	let dataArray = [];
	const waveLength = Math.floor( sampleRate / freq );

	for ( let i = 0; i < waveLength; i++ ) {
		dataArray.push(
			( 2 / Math.PI ) * Math.asin( Math.sin( 2 * Math.PI * freq * i / sampleRate ) )
		);
	}
	return dataArray;
}

function sawData( freq, sampleRate ) {
	let dataArray = [];
	const waveLength = Math.floor( sampleRate / freq );

	for ( let i = 0; i < waveLength; i++ ) {
		dataArray.push(
			2 * ( freq * ( i / sampleRate ) % 1 ) - 1
		);
	}
	return dataArray;
}


function addWaves() {
	let finalWave = [];
	finalWave.push( arguments[ 1 ] );
	for ( let i = 1; i < arguments.length; i++ ) {
		finalWave += arguments[ i ];
	}
	finalWave.map( function ( x ) {
		return ( x / arguments.length );
	} );
	return finalWave;
}


function makeWave( type, freq, resolution ) {
	newFreq = Math.min( freq, maxFreq ); // Limit in freq to avoid infinity
	let returnData = [];
	switch ( type ) {
	case 'sine':
		returnData = sineData( newFreq, resolution );
		break;
	case 'square':
		returnData = squareData( newFreq, resolution );
		break;
	case 'saw':
		returnData = sawData( newFreq, resolution );
		break;
	case 'tri':
		returnData = triData( newFreq, resolution );
		break;
	default:
		returnData = null;
	}

	return returnData;
}
