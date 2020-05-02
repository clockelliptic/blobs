import * as d3 from 'd3'

export function randomVelocity(temp) {
    // The Maxwell-Boltzman velocity distribution where temp is a renormalized temperature temp = kT/m
    return d3.randomNormal(0, Math.sqrt(temp))();
}

export function generateParticles(
        temp, 
        nDiffusers, diffuserRadius,
        nGasParticles, gasParticleRadius,
        canvasWidth, canvasHeight ) {

    const diffusers = d3.range(nDiffusers).map(() => {
        return {
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            vx: 0,
            vy: 0,
            r: diffuserRadius,
            color: '#000'
        }
    });

    const gas = d3.range(nGasParticles).map(() => {
        return {
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            vx: randomVelocity(temp),
            vy: randomVelocity(temp),
            r: gasParticleRadius,
            color: 'transparent'
        }
    });

    return diffusers.concat(gas);
}