const five = require( "johnny-five" ),
	argv = require( 'minimist' )( process.argv.slice( 2 ) );

// PARSE ARGUMENTS
let boardPath = null;

if ( argv.hasOwnProperty( 'b' ) ) {
	boardPath = argv.b;
}

let board = new five.Board( {
	port: boardPath, // /dev/tty.WSU_CSC-DevB
	repl: false,
	debug: false
} );

const rangeMax = 50.0;
const rangeMin = 4.0;
const pollRate = 25;

let buffer1 = [];
let buffer2 = [];

function rescaleData( value ) {
	return ( ( Math.min( Math.max( value, rangeMin ), rangeMax ) - rangeMin ) / ( rangeMax - rangeMin ) );
}

board.on( "ready", function () {
	let proximity = new five.Proximity( {
		controller: "HCSR04",
		pin: 7,
		freq: pollRate
	} );

	proximity.on( "data", function () {
		console.log( "Proximity  : ", rescaleData( this.cm ) );
	} );

	proximity.on( "data", function () {
		buffer1.push( rescaleData( this.cm ) );
	} );

	/*let proximity2 = new five.Proximity( {
		controller: "HCSR04",
		pin: 8,
		freq: pollRate
	} );

	proximity2.on( "data", function () {
		console.log( "Proximity2  : ", rescaleData( this.cm ) );
	} );

	proximity2.on( "data", function () {
		buffer2.push( rescaleData( this.cm ) );
	} );*/
} );

function giveData( size ) {
	let data = buffer1.slice( 0, size ); //size of thing to return
	buffer1.splice( 0, size );
	return data;
}

function giveData2( size ) {
	let data = buffer2.slice( 0, size ); //size of thing to return
	buffer2.splice( 0, size );
	return data;
}

let lib = {
	getData: function ( size ) {
		return giveData( size );
	},
	getData2: function ( size ) {
		return giveData2( size );
	},
	clrBuffer: function () {
		buffer1.length = 0;
		buffer2.length = 0;
	}
};

module.exports = lib;
