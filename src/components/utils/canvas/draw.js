// draw the points based on their current layout
export const useDraw = (canvas, width, height) => (points, pointWidth) => {
    const ctx = canvas.getContext('2d');
    ctx.save();
  
    // erase what is on the canvas currently
    ctx.clearRect(0, 0, width, height);
  
    // draw each point as a rectangle
    for (let i = 0; i < points.length; ++i) {
      const point = points[i];

      /* Rectangular dots -- better fps
      ctx.fillStyle = point.color;
      ctx.fillRect(point.x, point.y, pointWidth, pointWidth);
      */

      /* Circular dots -- lower fps */
      ctx.fillStyle = point.color;
			ctx.beginPath();
			ctx.arc(point.x, point.y, pointWidth/2, 0, 2*Math.PI);
			ctx.fill();
    }
  
    ctx.restore();
}


export const useDrawGas = (canvas, width, height) => (points) => {
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.save();

    // erase what is on the canvas currently
    ctx.clearRect(0, 0, width, height);

    // draw each point as a rectangle
    for (let i = 0; i < points.length; ++i) {
      const point = points[i];

      /* Rectangular dots -- better fps
      ctx.fillStyle = point.color;
      ctx.fillRect(point.x, point.y, pointWidth, pointWidth);
      */

      /* Circular dots -- lower fps */
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, 2*Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}