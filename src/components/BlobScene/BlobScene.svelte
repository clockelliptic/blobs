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

    .gooey {
        filter:url("#gooey")
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

<svg id="canvas">
    <defs>
        <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
    </defs>
    {#each d3.range(numBlobs) as i}
        <g id={`g${i}`} class="gooey">
        </g>
    {/each}
</svg>

<script>
    import { onMount, afterUpdate } from 'svelte';
    import { forceSurface, forceBounce } from '../../utils/d3-force'
    import { randomVelocity, graphemes } from '../../utils/d3-gas/gas'
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
    let timer;
    let currLayout = {i: 0};

    /* data */
    const GAS_DENSITY = 0.00001, // nodes per sq px
          numBlobs = 4,
          BLOB_RADIUS = 135,
          SEGMENT_RADIUS = 10, // 1/2 the thickness of the blob's outer ring
          GAS_PARTICLE_RADIUS = 50;
    let	TEMP = 1,
        numGasParticles = Math.round(canvasWidth * canvasHeight * GAS_DENSITY);

    /* physics simulator controls */
    let onTemperatureChange = () => {};

    onMount(() => {
        const svgCanvas = d3.select('svg#canvas')
                .attr('width', canvasWidth)
                .attr('height', canvasHeight);

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

        const {gas, nodes, links, wheels} = graphemes(
                                    TEMP, 
                                    numBlobs, BLOB_RADIUS, SEGMENT_RADIUS,
                                    numGasParticles, GAS_PARTICLE_RADIUS,
                                    canvasWidth, canvasHeight
                                )();

        const forceSim = d3.forceSimulation(nodes)
            .alphaDecay(0)
            .velocityDecay(0)
            .force('bounce', forceBounce()
                .radius(d => d.r)
            )
            .force(
                'link', 
                d3.forceLink()
                    .links(links)
                    .distance(link => link.distance)
                    .strength(link => link.strength)
                    .id(link => link.id)
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
            );
        // if desired, use forceSim.tick() here to fast-forward the simulation before initial render
        // stop the simulation and manually run a requestAnimFrame loop onMount
        forceSim.stop()

        function blobDigest() {
            for(let i = 0; i<numBlobs; i++) {
                let nodes = forceSim.nodes().filter(x => x.hub === i),
                    links = wheels[i];

                particleDigest(nodes, i)
                linkDigest(links, i)
            }
        }

        function particleDigest(nodes, hubIndex, blobGroup) {
            let particle = d3.select(`svg#canvas g#g${hubIndex}`).selectAll('circle.particle').data(nodes);
            particle.exit().remove();
            particle
                .merge(
                    particle.enter().append('circle')
                        .classed('particle', true)
                        .attr('r', d=> d.r)
                        .attr('fill', d => d.color)
                )
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        }

        function linkDigest(links, hubIndex, blobGroup) {
            let link = d3.select(`svg#canvas g#g${hubIndex}`).selectAll('line.link').data(links);

            link.exit().remove()
            link
                .merge(
                    link.enter().append('line')
                        .classed('link', true)
                        .attr('stroke', d => d.color)
                        .attr('stroke-width', d => 2*SEGMENT_RADIUS)
                )
                .attr('x1', function(d) {
                return d.source.x
                })
                .attr('y1', function(d) {
                return d.source.y
                })
                .attr('x2', function(d) {
                return d.target.x
                })
                .attr('y2', function(d) {
                return d.target.y
                })
        }

        function gasDigest() {
            let particle = svgCanvas.selectAll('circle.gas').data(forceSim.nodes().filter(x => x.type === 'gas'));

            particle.exit().remove();
            particle
                .merge(
                    particle.enter().append('circle')
                        .classed('gas', true)
                        .attr('r', d=> d.r)
                        .attr('fill', d => d.color)
                )
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        }

        function update() {
            forceSim.tick()
            blobDigest()
            gasDigest()
            requestAnimFrame(update);
        }
        
        onTemperatureChange = function (temp) {
            let updatedParticles = forceSim.nodes().map(node => {
                if (node.type === 'gas') console.log(node);
                return node.type !== 'gas' ? node : {
                    ...node,
                    vx: node.vx * Math.sqrt(temp) / Math.sqrt(TEMP),
                    vy: node.vy * Math.sqrt(temp) / Math.sqrt(TEMP),
                };  
            })
            forceSim.nodes(updatedParticles);
            TEMP = temp;
        }

        /*onTimescaleChange = function (temp) {
            let updatedParticles = forceSim.nodes().map(node => {
                return {
                    ...node,
                    vx: node.vx * Math.sqrt(timeScale) / Math.sqrt(TIMESCALE),
                    vy: node.vy * Math.sqrt(timeScale) / Math.sqrt(TIMESCALE),
                };  
            })
            forceSim.nodes(updatedParticles);
            TIMESCALE = timescale;
        }*/

        requestAnimFrame(update);
    })
    
    afterUpdate(() => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;  
    });

</script>