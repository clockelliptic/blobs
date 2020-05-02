import { forceBounce } from './bounce';
import { forceSurface } from './surface';
import * as d3 from 'd3'

export function useRandomWalk () {
    const GAS_DENSITY = 0.0005, // particles per sq px
            NUM_DIFFUSERS = 5,
            DIFFUSER_RADIUS = 50;
    let	TEMP = 10;

    const d3forceBounce = forceBounce()
    const d3forceSurface = forceSurface()

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
                r: 3
            }
        });

        return diffusers.concat(gas);
    }

    const forceSim = d3.forceSimulation()
        .alphaDecay(0)
        .velocityDecay(0)
        .on('tick', particleDigest)
        .force('bounce', d3forceBounce()
            .radius(d => d.r)
        )
        .force('container', d3forceSurface()
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
    function onTemperatureChange(temp) {
        d3.select('#temperature-val').text(temp);
        let updatedParticles = forceSim.nodes().map(node => {
            return node.r === DIFFUSER_RADIUS ? node : {
                x: node.x,
                y: node.y,
                vx: node.vx * Math.sqrt(temp) / Math.sqrt(TEMP),
                vy: node.vy * Math.sqrt(temp) / Math.sqrt(TEMP),
                r: 3
            };
        })
        forceSim.nodes(updatedParticles);
        TEMP = temp;
    }

    //

    function particleDigest() {
        let particle = svgCanvas.selectAll('circle.particle').data(forceSim.nodes());

        particle.exit().remove();

        particle
            .merge(
                particle.enter().append('circle')
                    .classed('particle', true)
                    .attr('r', d=>d.r)
                    .attr('fill', 'darkslategrey')
            )
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }
}