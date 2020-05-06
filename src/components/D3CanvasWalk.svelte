
<style>
    #controls {
        position: absolute;
        margin: 8px;
        padding: 1px 5px 5px 5px;
        background: rgba(230, 230, 250, 0.7);
        opacity: 0.5;
        border-radius: 3px;
        z-index: 1000;
    }

    #controls:hover {
        opacity: 1;
    }

    #temperature-control {
        position: relative;
        top: 3px;
        cursor: grab;
        cursor: -webkit-grab;
    }

    #temperature-control:active {
        cursor: grabbing;
        cursor: -webkit-grabbing;
    }
</style>

<div id="controls">
    Temperature:
    <input 
        id="temperature-control" 
        type="range" 
        min="1" 
        max="50" 
        step="1" 
        bind:value={temp}
        on:input={() => onTemperatureChange(temp)}
    >
    <span id="temperature-val">{temp}</span>
</div>

<canvas
    id="canvas"
    bind:this={canvas}
    width={canvasWidth}
    height={canvasHeight}
    style={`
        width: ${canvasWidth}px;
        height: ${canvasHeight}px;
    `}
></canvas>

<script>
    import { onMount, afterUpdate } from 'svelte';
    import { useDrawGas } from './utils/canvas/draw'
    import { createPoints, randomLayout, sineLayout, spiralLayout, gridLayout, phyllotaxisLayout } from './utils/d3-animation/layouts'
    import { animate } from './utils/d3-animation/animate'
    import { forceSurface, forceBounce } from './utils/d3-force'
    import { randomVelocity, graphemes } from './utils/d3-gas/gas'
    import * as d3 from 'd3'

    const d3forceBounce = forceBounce()
    const d3forceSurface = forceSurface()
    let temp = 5;

    /* Canvas setup */
    let canvas, 
        canvasWidth = 800, 
        canvasHeight = 800;

    /* animation settings */
    const duration = 1500;
    const ease = d3.easeCubic;
    let timer;
    let currLayout = {i: 0};

    /* data */
    const GAS_DENSITY = 0.00001, // particles per sq px
          numDiffusers = 7,
          DIFFUSER_RADIUS = 15,
          GAS_PARTICLE_RADIUS = 10;
    let	TEMP = 1,
        numGasParticles = Math.round(canvasWidth * canvasHeight * GAS_DENSITY);;

    /* physics simulator controls */
    let onTemperatureChange = () => {};

    onMount(() => {
        window.requestAnimFrame = (() => 
			window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(callback, element){
				window.setTimeout(callback, 1000 / 60);
			}
        )();

        const {particles, links} = graphemes(
                                    TEMP, 
                                    numDiffusers, DIFFUSER_RADIUS,
                                    numGasParticles, GAS_PARTICLE_RADIUS,
                                    canvasWidth, canvasHeight
                                )()

        const forceSim = d3.forceSimulation(particles)
            .alphaDecay(0)
            .velocityDecay(0)
            .on('tick', particleDigest)
            .force('bounce', forceBounce()
                .radius(d => d.r)
            )
            .force('link', d3.forceLink(links).distance(7).strength(0.2))
            .force('container', forceSurface()
                .surfaces([
                    {from: {x:0,y:0}, to: {x:0,y:canvasHeight}},
                    {from: {x:0,y:canvasHeight}, to: {x:canvasWidth,y:canvasHeight}},
                    {from: {x:canvasWidth,y:canvasHeight}, to: {x:canvasWidth,y:0}},
                    {from: {x:canvasWidth,y:0}, to: {x:0,y:0}}
                ])
                .oneWay(true)
                .radius(d => d.r)
            );
        forceSim.stop()

            /* animation update */
        function particleDigest() {
            const draw = useDrawGas(canvas, canvasWidth, canvasHeight);
            draw(forceSim.nodes())
        }

        function update() {
            forceSim.tick()
            particleDigest()
            console.log("update")
            requestAnimFrame(update);
        }
        
        onTemperatureChange = function (temp) {
            let updatedParticles = forceSim.nodes().map(node => {
                return node.r === DIFFUSER_RADIUS ? node : {
                    x: node.x,
                    y: node.y,
                    vx: node.vx * Math.sqrt(temp) / Math.sqrt(TEMP),
                    vy: node.vy * Math.sqrt(temp) / Math.sqrt(TEMP),
                    r: GAS_PARTICLE_RADIUS,
                    color: 'rgba(0,0,0,0.5)'
                };
            })
            forceSim.nodes(updatedParticles);
            TEMP = temp;
        }

        requestAnimFrame(update);
    })
    
    afterUpdate(() => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;  
        const screenScale = 1; //window.devicePixelRatio || 1;   
        canvas.getContext('2d').scale(screenScale, screenScale);
    });

</script>