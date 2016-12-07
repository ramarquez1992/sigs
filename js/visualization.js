function draw(plotData, deltaY, elementName) {
  var newData = [];

  for (var i = 0; i < plotData.length - 1; i++){
    if (Math.abs(plotData[i+1] - plotData[i]) >= deltaY){
      newData.push(plotData[i+1]);
    }
  }

  var canvas = document.getElementById(elementName);
  var ctx = canvas.getContext('2d');
  var height = canvas.height;
  var width = canvas.width;

  ctx.clearRect(0,0,width,height);  // clear canvas
  ctx.beginPath();
  ctx.moveTo(0,height/2 - newData[0]*height/2);

  var x = 0;
  var y = 0;
  for(var j in newData) {
    y = newData[j];
    ctx.lineTo(x, height/2 - y*height/2);
    x += width/(newData.length-1.0);
  }

  ctx.stroke();
  ctx.closePath();
}
