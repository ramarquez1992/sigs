var five = require( "johnny-five" );

var board = new five.Board();
var rangeMax = 50.0;
var rangeMin = 4.0;
var pollRate = 25;

var buffer = [];

function rescaleData( value ) {
	return ( ( Math.min( Math.max( value, rangeMin ), rangeMax ) - rangeMin ) / ( rangeMax - rangeMin ) );
}

board.on( "ready", function () {
	var proximity = new five.Proximity( {
		controller: "HCSR04",
		//pin: "A0",
		pin: 7,
		freq: pollRate
	} );

	proximity.on( "data", function () {
		console.log( "Proximity  : ", rescaleData( this.cm ) );
	} );

	proximity.on( "data", function () {
		buffer.push( rescaleData( this.cm ) );
	} );
} );

function giveData( size ) {
	var data = buffer.slice( 0, size ); //size of thing to return
	buffer.splice( 0, size );
	return data;
}

var lib = {
	getData: function ( size ) {
		return giveData( size );
	},
	clrBuffer: function () {
		buffer.length = 0;
	}
};

module.exports = lib;

