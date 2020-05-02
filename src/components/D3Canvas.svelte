
<canvas
    id="canvas"
    bind:this={canvas}
    width={canvasWidth}
    height={canvasHeight}
    style={`
        width: ${canvasWidth}px;
        height: ${canvasHeight}px;
        overflow: hidden;
    `}
></canvas>

<script>
	import { onMount, afterUpdate } from 'svelte';
    import { useDraw } from './utils/canvas/draw'
    import { 
        createPoints,
        randomLayout,
        sineLayout,
        spiralLayout,
        gridLayout, 
        phyllotaxisLayout 
    } from './utils/d3-animation/layouts'
    import { animate } from './utils/d3-animation/animate'
    import * as d3 from 'd3'

    /* Canvas setup */
    let canvas, 
        canvasWidth = 0, 
        canvasHeight = 0;

    /* animation settings */
    const duration = 1500;
    const ease = d3.easeCubic;
    let timer;
    let currLayout = {i: 0};

    /* data */
    const numPoints = 7000;
    const pointWidth = 4,
          pointMargin = 6;
    const points = createPoints(numPoints, pointWidth, canvasWidth, canvasHeight);

    /* curried helpers */
    const toGrid = (points) => gridLayout(points, pointWidth + pointMargin, canvasWidth);
    const toSine = (points) => sineLayout(points, pointWidth + pointMargin, canvasWidth, canvasHeight);
    const toSpiral = (points) => spiralLayout(points, pointWidth + pointMargin, canvasWidth, canvasHeight);
    const toPhyllotaxis = (points) => phyllotaxisLayout(points, pointWidth + pointMargin, canvasWidth / 2, canvasHeight / 2);
    const toRandom = (points) => randomLayout(poimts, pointWidth + pointMargin, canvasWidth, canvasHeight)

    const layouts = [
          toSine,
          toPhyllotaxis,
          toSpiral,
          toSine,
          toPhyllotaxis
    ];

    afterUpdate(() => { 
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;  
        const screenScale = 1; //window.devicePixelRatio || 1;   
        console.log(screenScale)
        canvas.getContext('2d').scale(screenScale, screenScale);
        // start the animation
        animate( useDraw, 
            canvas, canvasWidth, canvasHeight,
            layouts, layouts[currLayout.i], currLayout,
            points, pointWidth, 
            timer, duration, ease 
        );
    })

</script>