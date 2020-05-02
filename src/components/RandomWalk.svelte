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
<svg id="canvas"></svg>

<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3'
    import { forceSurface, forceBounce } from './d3-force-utils'

    const d3forceBounce = forceBounce()
    const d3forceSurface = forceSurface()
    let temp = 5;
    let onTemperatureChange;

	onMount(() => {
        const GAS_DENSITY = 0.0001, // particles per sq px
            NUM_DIFFUSERS = 5,
            DIFFUSER_RADIUS = 50,
            GAS_PARTICLE_RADIUS = 10;
        let	TEMP = 1;

        const canvasWidth = window.innerWidth,
            canvasHeight = window.innerHeight,
            numGasParticles = Math.round(canvasWidth * canvasHeight * GAS_DENSITY),
            svgCanvas = d3.select('svg#canvas')
                .attr('width', canvasWidth)
                .attr('height', canvasHeight);

        function randomVelocity(temp) {
            // The Maxwell-Boltzman velocity distribution where temp is a renormalized temperature temp = kT/m
            return d3.randomNormal(0, Math.sqrt(temp))();
        }

        function generateParticles(temp) {
            const diffusers = d3.range(NUM_DIFFUSERS).map(() => {
                return {
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight,
                    vx: 0,
                    vy: 0,
                    r: DIFFUSER_RADIUS
                }
            });

            const gas = d3.range(numGasParticles).map(() => {
                return {
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight,
                    vx: randomVelocity(temp),
                    vy: randomVelocity(temp),
                    r: GAS_PARTICLE_RADIUS
                }
            });

            return diffusers.concat(gas);
        }

        const forceSim = d3.forceSimulation()
            .alphaDecay(0)
            .velocityDecay(0)
            .on('tick', particleDigest)
            .force('bounce', forceBounce()
                .radius(d => d.r)
            )
            .force('container', forceSurface()
                .surfaces([
                    {from: {x:0,y:0}, to: {x:0,y:canvasHeight}},
                    {from: {x:0,y:canvasHeight}, to: {x:canvasWidth,y:canvasHeight}},
                    {from: {x:canvasWidth,y:canvasHeight}, to: {x:canvasWidth,y:0}},
                    {from: {x:canvasWidth,y:0}, to: {x:0,y:0}}
                ])
                .oneWay(true)
                .radius(d => d.r)
            )
            .nodes(generateParticles(TEMP));

        // Event handlers
        onTemperatureChange = function (temp) {
            d3.select('#temperature-val').text(temp);
            let updatedParticles = forceSim.nodes().map(node => {
                return node.r === DIFFUSER_RADIUS ? node : {
                    x: node.x,
                    y: node.y,
                    vx: node.vx * Math.sqrt(temp) / Math.sqrt(TEMP),
                    vy: node.vy * Math.sqrt(temp) / Math.sqrt(TEMP),
                    r: GAS_PARTICLE_RADIUS
                };
            })
            forceSim.nodes(updatedParticles);
            TEMP = temp;
        }

        function particleDigest() {
            let particle = svgCanvas.selectAll('circle.particle').data(forceSim.nodes());

            particle.exit().remove();
            particle
                .merge(
                    particle.enter().append('circle')
                        .classed('particle', true)
                        .attr('r', d=> d.r)
                        .attr('fill', d => d.r===DIFFUSER_RADIUS ? 'darkslategrey' : 'transparent')
                )
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        }
    });
    
</script>