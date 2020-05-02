// draw the points based on their current layout
export const useDraw = (canvas, width, height) => (points, pointWidth) => {
    const ctx = canvas.getContext('2d');
    ctx.save();
  
    // erase what is on the canvas currently
    ctx.clearRect(0, 0, width, height);
  
    // draw each point as a rectangle
    for (let i = 0; i < points.length; ++i) {
      const point = points[i];
      ctx.fillStyle = point.color;
      ctx.fillRect(point.x, point.y, pointWidth, pointWidth);
    }
  
    ctx.restore();
}