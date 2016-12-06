var five = require( "johnny-five" );
var argv = require( 'minimist' )( process.argv.slice( 2 ) );

// PARSE ARGUMENTS
var boardPath = null;
if ( argv.hasOwnProperty( 'b' ) ) {
	boardPath = argv.b;
}

var board = new five.Board( {
	port: boardPath, // /dev/tty.WSU_CSC-DevB
	repl: false,
	debug: false
} );

var rangeMax = 50.0;
var rangeMin = 4.0;
var pollRate = 25;

var buffer1 = [];
var buffer2 = [];

function rescaleData( value ) {
	return ( ( Math.min( Math.max( value, rangeMin ), rangeMax ) - rangeMin ) / ( rangeMax - rangeMin ) );
}

board.on( "ready", function () {
	var proximity = new five.Proximity( {
		controller: "HCSR04",
		pin: 7,
		freq: pollRate
	} );

	var proximity2 = new five.Proximity( {
		controller: "HCSR04",
		pin: 8,
		freq: pollRate
	} );

	proximity.on( "data", function () {
		console.log( "Proximity  : ", rescaleData( this.cm ) );
	} );

	proximity.on( "data", function () {
		buffer1.push( rescaleData( this.cm ) );
	} );

	proximity2.on( "data", function () {
		console.log( "Proximity2  : ", rescaleData( this.cm ) );
	} );

	proximity2.on( "data", function () {
		buffer2.push( rescaleData( this.cm ) );
	} );
} );

function giveData( size ) {
	var data = buffer1.slice( 0, size ); //size of thing to return
	buffer1.splice( 0, size );
	return data;
}

function giveData2( size ) {
	var data = buffer2.slice( 0, size ); //size of thing to return
	buffer2.splice( 0, size );
	return data;
}

var lib = {
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
