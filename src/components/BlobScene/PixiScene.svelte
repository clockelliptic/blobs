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

<div bind:this={pixiContainer} />

<script>
    import { onMount, afterUpdate } from 'svelte';
    import { randomVelocity, graphemes } from '../../utils/d3-gas/gas'
    import * as d3 from 'd3'

    /* Pixi Scene setup */
    let PIXI,
        pixiContainer,
        sceneWidth = 800, 
        sceneHeight = 800;    
    
    /* gas simulator configuration */
    const GAS_DENSITY = 0.00001, // particles per sq px
          numBlobs = 4,
          blobRadius = 135,
          segmentRadius = 10, // 1/2 the thickness of the blob's outer ring
          gasParticleRadius = 50;

    let temp = 1,
        TEMP = 1,
        onTemperatureChange = () => {},
        numGasParticles = Math.round(sceneWidth * sceneHeight * GAS_DENSITY);
    
    const {
        gas, 
        nodes, 
        links, 
        wheels
    } = graphemes(
            TEMP, 
            numBlobs, blobRadius, segmentRadius,
            numGasParticles, gasParticleRadius,
            sceneWidth, sceneHeight
        )();

    /* d3.js worker thread */
    const worker = new Worker("./js/blobWorker.js");
    let start = () => {}, // reassign in onMount
        ticked = () => {}, // reassign in onMount
        ended = () => {}; // reassign in onMount

    worker.postMessage({
        type: 'start',
        nodes,
        links,
        sceneWidth,
        sceneHeight
    })

    worker.onmessage = function(event) {
        switch (event.data.type) {
            case "tick": return ticked(event.data);
            case "end": return ended(event.data);
        }
    }

    worker.onerror = function(event) {
        return console.log("error", event)
    }

    onTemperatureChange = function (temp) {
        let updatedParticles = nodes.map(node => {
            return node.type !== 'gas' ? node : {
                ...node,
                vx: node.vx * Math.sqrt(temp) / Math.sqrt(TEMP),
                vy: node.vy * Math.sqrt(temp) / Math.sqrt(TEMP),
            };  
        })

        worker.postMessage({
            type: 'tick',
            nodes,
            links
        })

        TEMP = temp;
    }

    /*onTimescaleChange = function (temp) {
        let updatedParticles = nodes.map(node => {
            return {
                ...node,
                vx: node.vx * Math.sqrt(timeScale) / Math.sqrt(TIMESCALE),
                vy: node.vy * Math.sqrt(timeScale) / Math.sqrt(TIMESCALE),
            };  
        })
        worker.postMessage({
            nodes,
            links
        })
        TIMESCALE = timescale;
    }*/

    onMount(async () => {
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

        PIXI = await import("pixi.js");

        console.log(worker)
        
        /* PIXI configuration */
        let stage = new PIXI.Container();
        let renderer = PIXI.autoDetectRenderer(sceneWidth, sceneHeight,
            {antialias: !0, transparent: !0, resolution: 1});
        
        pixiContainer = renderer.view;

        /* service worker configuration */
        start = (nodes, links) => {
            new Array(numBlobs).fill().forEach((_,i) => {
                let gfx = new PIXI.Graphics();
                stage.addChild(gfx);

                let segments = nodes.filter(node => node.type === 'segment' && node.hub===i),
                    hub = nodes.filter(node => node.type === 'hub' && node.hub===i),
                    links = links.filter(link => link.source.type === 'segment' && link.source.hub === i);

                segments.forEach(segment => {
                    segment.gfx = gfx;
                })

                links.forEach(link => {
                    link.gfx = gfx;
                })
            });
            //nodes = segments.concat(hub);
            console.log("START", segments)
            ticked({links, nodes})
        }

        ticked = (data) => {
            let nodes = data.nodes,
                links = data.links;

            let wheels = new Array(numBlobs).fill().map((_,i) => {
                let segments = nodes.filter(node => node.type === 'segment' && node.hub===i),
                    hub = nodes.filter(node => node.type === 'hub' && node.hub===i),
                    //links = links.filter(link => link.source.type === 'segment' && link.source.hub === i),
                    gfx = segments.length && segments[0].gfx;

                if (gfx) {
                
                    segments.forEach(segment => {
                        let {x, y, gfx} = segment;
                        gfx.lineStyle(1.5, 0xFFFFFF);
                        gfx.beginFill(colour(node.group));
                        gfx.drawCircle(0, 0, 5);
                    })

                    stage.addChild(gfx);
                }
                else {
                    //console.log("segments", segments)
                }
            })

            /*
            nodeList.forEach(function(group) {
            groupLkup[group].cTexture = PIXI.RenderTexture.create(radius*2, radius*2)
            const color = Number.parseInt(colors((groupLkup[group].type)/nodeList.length), 16);
            const cG = new PIXI.Graphics();
            cG.lineStyle(.25, 0xFFFFFF);
            cG.beginFill(color, 1);
            cG.drawCircle(radius, radius, radius);
            cG.endFill();
            renderer.render(cG, groupLkup[group].cTexture);
            });

            nodeList.forEach(function(group) {
            groupLkup[group].lTexture = PIXI.RenderTexture.create(1, 2)
            const color = Number.parseInt(colors((groupLkup[group].type)/nodeList.length), 16);
            const lG = new PIXI.Graphics();
            lG.lineStyle(.1, color, .05);
            lG.moveTo(0,0);
            lG.lineTo(1, 1);
            renderer.render(lG, groupLkup[group].lTexture);
            });*/
        }

        function update() {
            requestAnimFrame(update);
        }

        requestAnimFrame(update);
    })
    
    afterUpdate(() => {
        sceneWidth = window.innerWidth;
        sceneHeight = window.innerHeight;  
    });

</script>