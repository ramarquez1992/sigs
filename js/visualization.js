function draw( plotData, deltaY, elementName ) {
	let newData = [];

	for ( let i = 0; i < plotData.length - 1; i++ ) {
		if ( Math.abs( plotData[ i + 1 ] - plotData[ i ] ) >= deltaY ) {
			newData.push( plotData[ i + 1 ] );
		}
	}

	const canvas = document.getElementById( elementName );
	let ctx = canvas.getContext( '2d' );
	const height = canvas.height;
	const width = canvas.width;

	ctx.clearRect( 0, 0, width, height ); // clear canvas
	ctx.beginPath();
	ctx.moveTo( 0, height / 2 - newData[ 0 ] * height / 2 );

	let x = 0;
	let y = 0;
	for ( let j in newData ) {
		y = newData[ j ];
		ctx.lineTo( x, height / 2 - y * height / 2 );
		x += width / ( newData.length - 1.0 );
	}

	ctx.stroke();
	ctx.closePath();
}
