import * as d3 from 'd3'
export function animate( useDraw, 
        canvas, canvasWidth, canvasHeight,
        layouts, layout, currLayout,
        points, pointWidth, 
        timer, duration, ease ) {
    const draw = useDraw(canvas, canvasWidth, canvasHeight);
    
    // store the source position
    points.forEach(point => {
      point.sx = point.x;
      point.sy = point.y;
    });
  
    // get destination x and y position on each point
    layout(points);
  
    // store the destination position
    points.forEach(point => {
      point.tx = point.x;
      point.ty = point.y;
    });
  
    timer = d3.timer((elapsed) => {
      // compute how far through the animation we are (0 to 1)
      const t = Math.min(1, ease(elapsed / duration));
  
      // update point positions (interpolate between source and target)
      points.forEach(point => {
        point.x = point.sx * (1 - t) + point.tx * t;
        point.y = point.sy * (1 - t) + point.ty * t;
      });
  
      // update what is drawn on screen
      draw(points, pointWidth);
  
      // if this animation is over
      if (t === 1) {
        // stop this timer for this layout and start a new one
        timer.stop();

        // update to use next layout
        currLayout.i = (currLayout.i + 1) % layouts.length;
  
        // start animation for next layout
        animate( useDraw, 
            canvas, canvasWidth, canvasHeight,
            layouts, layouts[currLayout.i], currLayout,
            points, pointWidth, 
            timer, duration, ease );
      }
    });
}