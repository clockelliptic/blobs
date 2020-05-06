import * as d3 from 'd3'

export function randomVelocity(temp) {
    // The Maxwell-Boltzman velocity distribution where temp is a renormalized temperature temp = kT/m
    return d3.randomNormal(0, Math.sqrt(temp))();
}

export function graphemes(
        temp, 
        nDiffusers, diffuserRadius, segmentRadius,
        nGasParticles, gasParticleRadius,
        canvasWidth, canvasHeight ) {

    const nSegments = 24 // per wheel
    const nHubs = nDiffusers
    const colors = [
        '#2E72E7',
        '#FD86B7',
        '#FEC53D',
        '#D54D37'
    ]

    let hubs = d3.range(nHubs).map((x, i) => {
        const ci = 255 * ((i%nSegments)/nSegments);
        return {
            id: `hub-${i}`,
            x: 200*(i+1),
            y: 200*(i+1),
            //fx: 400*i,
            //fy: 400*i,
            vx: 0,
            vy: 0,
            r: segmentRadius,
            color: 'transparent'
        }
    });

    let segments = hubs.map((hub, i) =>
        d3.range(nSegments).map((x, j) => {
            const ci = 255 * ((j%nSegments)/nSegments),
                  angle = ((2*Math.PI)/nSegments)*j;

            return {
                hub: i,
                id: `seg-${i}-${j}`,
                x: hub.x + diffuserRadius*Math.cos(angle),
                y: hub.y + diffuserRadius*Math.sin(angle),
                vx: 0,
                vy: 0,
                r: segmentRadius,
                color: colors[i%nDiffusers]
            }
        })
    );

    let wheels = segments.map((wheelset, i) => 
                                wheelset.map((seg, j) => ({
                                        source: seg.id,
                                        target: wheelset[(i*wheelset.length+j+1)%wheelset.length].id,
                                        distance: 2*diffuserRadius*Math.sin(Math.PI/nSegments) * 0.5,
                                        strength: 0.375,
                                        color: seg.color
                                    })
                                ));

    let hubspokes = hubs.map((hub, i) => 
        segments[i].map((seg, j) => ({
            source: hub.id,
            target: seg.id,
            distance: diffuserRadius,
            strength: 0.0075
        }))
    );

    let gas = d3.range(nGasParticles).map((x, i) => {
        return {
            type: 'gas',
            id: `gas-${i}`,
            x: Math.random() * canvasWidth *0,
            y: Math.random() * canvasHeight *0,
            vx: randomVelocity(temp),
            vy: randomVelocity(temp),
            r: gasParticleRadius,
            color: 'rgba(0,0,0,0.0)'
        }
    });

    segments = segments.reduce((acc,x) => acc.concat(x),[])
    //wheels = wheels.reduce((acc,x) => acc.concat(x),[])
    hubspokes = hubspokes.reduce((acc,x) => acc.concat(x),[]);

    const particles = hubs.concat(segments).concat(gas),
          links = wheels.reduce((acc,x) => acc.concat(x),[]).concat(hubspokes);

    return () => ({
        gas,
        particles,
        links,
        wheels
    });
}