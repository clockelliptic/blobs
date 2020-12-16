importScripts("/js/d3-force/d3-surface-bounce.js")
importScripts("https://d3js.org/d3-collection.v1.min.js");
importScripts("https://d3js.org/d3-dispatch.v1.min.js");
importScripts("https://d3js.org/d3-quadtree.v1.min.js");
importScripts("https://d3js.org/d3-timer.v1.min.js");
importScripts("https://d3js.org/d3-force.v1.min.js");


let forceSim,
    sceneHeight = 0,
    sceneWidth = 0
    nodes = [],
    links = [];

const makeForceSim = (nodes, links) => d3.forceSimulation(nodes)
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
                    {from: {x:0,y:0}, to: {x:0,y:sceneHeight}},
                    {from: {x:0,y:sceneHeight}, to: {x:sceneWidth,y:sceneHeight}},
                    {from: {x:sceneWidth,y:sceneHeight}, to: {x:sceneWidth,y:0}},
                    {from: {x:sceneWidth,y:0}, to: {x:0,y:0}}
                ])
                .oneWay(true)
                .radius(d => d.r)
            )
            .on('tick', tick);

function start(_nodes, _links, initialSceneHeight, initialSceneWidth) {
    nodes = _nodes;
    links = _links;
    forceSim = makeForceSim(_nodes, _links);

    sceneHeight = initialSceneHeight;
    sceneWidth = initialSceneWidth;
    console.log("worker send start message")
    postMessage({
        type: 'start',
        nodes: forceSim.nodes(),
        links
    })
}

function tick() {
    postMessage({
        type: 'tick',
        nodes: forceSim.nodes(),
        links
    })
}

function stop() {
    if (forceSim) forceSim.stop();
}

// if desired, use forceSim.tick() here to fast-forward the simulation before initial render
// stop the simulation and manually run a requestAnimFrame loop onMount
// forceSim.stop()

onmessage = function (event) {
    switch (event.data.type) {
        case 'start':
            return start(event.data.nodes, event.data.links, event.data.sceneWidth, event.data.sceneHeight);
        case 'tick':
            return tick();
        case 'stop':
            return stop();
    }
}