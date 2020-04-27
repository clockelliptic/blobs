export default function init(Hammer) {
    var width = document.querySelector('#bounceContainer').clientWidth;
    var height = document.querySelector('#bounceContainer').clientHeight;
    console.log(width, height)
    canvas.getContext("2d").canvas.width  = width;
    canvas.getContext("2d").canvas.height = height;
    background.getContext("2d").canvas.width  = width;
    background.getContext("2d").canvas.height = height;
    var EPS = 0.0001;
    var x = [];
    var y = [];
    var xLast = [];
    var yLast = [];
    var ax = [];
    var ay = [];
    var nParts = 36;
    var tStep = 1.0/60.0;
    var perimIters = 10; //number of perimiter fixing iterations to do - more means closer to perfect solidity
    var perimterTensioner = 0; // larger number = firmer outer tension, too much tension causes collapse
    var gravityForce = -9.8; //-9.8
    var rad = 10.0;
    var blobAreaTarget;
    var sideLength;
    var mouseRad = 5.0;
    var mousePos = [width/20, height/20];

    var ring = new Image();
    var unloaded = 1;
    ring.onload = function() {
        --unloaded;
    };
    ring.src = 'images/ring.png';

    var dot = new Image();
    ++unloaded;
    dot.onload = function() {
        --unloaded;
    };
    dot.src = 'images/dot.png';

    var hammer = new Hammer(document.getElementById("canvas"), {prevent_default:true});
    addEvent("mousemove", document.getElementById('canvas'), onMove);

    setupSegments();
    requestAnimFrame(update);

    function addEvent(evnt, elem, func) {
        if (elem.addEventListener)  // W3C DOM
            elem.addEventListener(evnt,func,false);
        else if (elem.attachEvent) { // IE DOM
            elem.attachEvent("on"+evnt, func);
        }
        else {
            elem[evnt] = func;
        }
    }

    hammer.ondrag = function(e) {
        var p = mapInv([Math.round(e.position.x), Math.round(e.position.y)]);
        if (!isPointInBlob(p)) {
            mousePos = p;
        }
    };

    function setupSegments() {
        x = new Array(nParts);
        y = new Array(nParts);
        xLast = new Array(nParts);
        yLast = new Array(nParts);
        ax = new Array(nParts);
        ay = new Array(nParts);

        var cx = width/20;
        var cy = height/20;
        for (var i=0; i<nParts; ++i) {
            var ang = i*2*Math.PI / nParts;
            x[i] = cx + Math.sin(ang)*rad;
            y[i] = cy + Math.cos(ang)*rad;
            xLast[i] = x[i];
            yLast[i] = y[i];
            ax[i] = 0;
            ay[i] = 0;
        }

        // sqrt(dx^2 + dy^2)
        sideLength = Math.sqrt( (x[1]-x[0])*(x[1]-x[0]) + (y[1]-y[0])*(y[1]-y[0]) ) - perimterTensioner;

        blobAreaTarget = getArea();
        fixPerimeter();
    }

    function getArea() {
        var area = 0.0;
        area += x[nParts-1]*y[0]-x[0]*y[nParts-1];
        for (var i=0; i<nParts-1; ++i){
            area += x[i]*y[i+1]-x[i+1]*y[i];
        }
        area *= 0.5;
        return area;
    }

    function integrateSegments(dt) {
        var dtSquared = dt*dt;
        var gravityAddY = -gravityForce * dtSquared;
        for (var i=0; i<nParts; ++i) {
            var bufferX = x[i];
            var bufferY = y[i];
            x[i] = 2*x[i] - xLast[i] + ax[i]*dtSquared;
            y[i] = 2*y[i] - yLast[i] + ay[i]*dtSquared + gravityAddY;
            xLast[i] = bufferX;
            yLast[i] = bufferY;
            ax[i] = 0;
            ay[i] = 0;
        }
    }

    function collideWithEdge() {
        for (var i=0; i<nParts; ++i) {
            if (x[i] < 0) {
                x[i] = 0;
                yLast[i] = y[i];
            }
            else if (x[i] > width/10) {
                x[i] = width/10;
                yLast[i] = y[i];
            }
            if (y[i] < 0) {
                y[i] = 0;
                xLast[i] = x[i];
            } else if (y[i] > height/10) {
                y[i] = height/10;
                xLast[i] = x[i];
            }
        }
    }

    function fixPerimeter() {
        // Fix up side lengths
        var diffx = new Array(nParts);
        var diffy = new Array(nParts);
        for (var i = 0; i < nParts; ++i) {
            diffx[i] = 0;
            diffy[i] = 0;
        }

        for (var j=0; j<perimIters; ++j) {
            for (var i=0; i<nParts; ++i) {
                var next = (i==nParts-1)?0:i+1;
                var dx = x[next]-x[i];
                var dy = y[next]-y[i];
                var distance = Math.sqrt(dx*dx+dy*dy);
                if (distance < EPS) distance = 1.0;
                var diffRatio = 1.0 - sideLength / distance;
                diffx[i] += 0.5 * dx * diffRatio;
                diffy[i] += 0.5 * dy * diffRatio;
                diffx[next] -= 0.5 * dx * diffRatio;
                diffy[next] -= 0.5 * dy * diffRatio;
            }

            for (var i=0; i<nParts; ++i) {
                x[i] += diffx[i];
                y[i] += diffy[i];
                diffx[i] = 0;
                diffy[i] = 0;
            }
        }
    }

    function constrainBlobEdges() {
        fixPerimeter();
        var perimeter = 0.0;
        var nx = new Array(nParts); //normals
        var ny = new Array(nParts);
        for (var i=0; i<nParts; ++i) {
            var next = (i==nParts-1)?0:i+1;
            var dx = x[next]-x[i];
            var dy = y[next]-y[i];
            var distance = Math.sqrt(dx*dx+dy*dy);
            if (distance < EPS) distance = 1.0;
            nx[i] = dy / distance;
            ny[i] = -dx / distance;
            perimeter += distance;
        }

        var deltaArea = blobAreaTarget - getArea();
        var toExtrude = 0.5*deltaArea / perimeter;

        for (var i=0; i<nParts; ++i) {
            var next = (i==nParts-1)?0:i+1;
            x[next] += toExtrude * (nx[i] + nx[next]);
            y[next] += toExtrude * (ny[i] + ny[next]);
        }
    }

    function collideWithMouse() {
        if (isPointInBlob(mousePos)) {
            mousePos[1] = 1000;
        }
        var mx = mousePos[0];
        var my = mousePos[1];
        for (var i=0; i<nParts; ++i) {
            var dx = mx-x[i];
            var dy = my-y[i];
            var distSqr = dx*dx+dy*dy;
            if (distSqr > mouseRad*mouseRad) continue;
            if (distSqr < EPS*EPS) continue;
            var distance = Math.sqrt(distSqr);
            x[i] -= dx*(mouseRad/distance-1.0);
            y[i] -= dy*(mouseRad/distance-1.0);
        }
    }

    window.onresize = function(event) {
        width = document.querySelector('#bounceContainer').clientWidth;
        height = document.querySelector('#bounceContainer').clientHeight;
        canvas.getContext("2d").canvas.width  = width;
        canvas.getContext("2d").canvas.height = height;
        background.getContext("2d").canvas.width  = width;
        background.getContext("2d").canvas.height = height;
        setupSegments();
    }

    function update() {
        for (var i=0; i<3; ++i) {
            integrateSegments(tStep);
            constrainBlobEdges();
            collideWithEdge();
            collideWithMouse();
        }

        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, width, height);
        draw(ctx);
        drawMouse(ctx);

        requestAnimFrame(update);
    }

    function onMove(e) {
        var p = mapInv(getCursorPosition(e));
        if (!isPointInBlob(p)) {
            mousePos = p;
        }
    }

    function isPointInBlob(p){
        for(var c = false, i = -1, l = nParts, j = l - 1; ++i < l; j = i)
        ((y[i] <= p[1] && p[1] < y[j]) || (y[j] <= p[1] && p[1] < y[i]))
        && (p[0] < (x[j] - x[i]) * (p[1] - y[i]) / (y[j] - y[i]) + x[i])
        && (c = !c);
        return c;
    }

    function getCursorPosition(e) {
        var x;
        var y;
        if (e.pageX || e.pageY) { 
            x = e.pageX;
            y = e.pageY;
        }
        else { 
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
        }
        var canvas = document.getElementById('canvas');
        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;
        return [x, y];
    }

    function drawMouse(ctx) {
        if (unloaded == 0) {
            var p = map(mousePos);
                ctx.drawImage(dot, p[0] - (mouseRad*10), p[1] - (mouseRad*10), mouseRad*20, mouseRad*20);
        }
    }

    function draw(ctx) {
        if (unloaded == 0) {
            var center_x = 0;
            var center_y = 0;
            for (var i = 0; i < nParts; ++i) {
                center_x += x[i];
                center_y += y[i];
            }
            center_x /= nParts;
            center_y /= nParts;
            var p1 = map([center_x, center_y]);

            var n = nParts/2;
            for (var i = 0; i < n; ++i) {
                var j = i * nParts/n;
                var k = (i+1) * nParts/n;
                if (k == nParts) k = 0;
                var p2 = map([x[j], y[j]]);
                var p3 = map([x[k], y[k]]);
                var a1 = 2*Math.PI * (i / n);
                var a2 = 2*Math.PI * ((i+1) / n);
                var p4 = [ring.width/2 + Math.sin(a1) * ring.width/2, ring.height/2 + Math.cos(a1) * ring.height/2];
                var p5 = [ring.width/2 + Math.sin(a2) * ring.width/2, ring.height/2 + Math.cos(a2) * ring.height/2];
                textureMap(ctx, ring, [{x:p1[0],y:p1[1],u:ring.width/2,v:ring.height/2}, {x:p2[0],y:p2[1],u:p4[0],v:p4[1]}, {x:p3[0],y:p3[1],u:p5[0],v:p5[1]}]);
            }
        }
    }

    //http://stackoverflow.com/questions/4774172/image-manipulation-and-texture-mapping-using-html5-canvas
    function textureMap(ctx, texture, pts) {
        var x0 = pts[0].x, x1 = pts[1].x, x2 = pts[2].x;
        var y0 = pts[0].y, y1 = pts[1].y, y2 = pts[2].y;
        var u0 = pts[0].u, u1 = pts[1].u, u2 = pts[2].u;
        var v0 = pts[0].v, v1 = pts[1].v, v2 = pts[2].v;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 + (x1-x0), y1 + (y1-y0));
        ctx.lineTo(x2 + (x2-x0), y2 + (y2-y0));
        ctx.closePath(); ctx.clip();
        var delta = u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2;
        var delta_a = x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2;
        var delta_b = u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2;
        var delta_c = u0*v1*x2 + v0*x1*u2 + x0*u1*v2 - x0*v1*u2
                - v0*u1*x2 - u0*x1*v2;
        var delta_d = y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2;
        var delta_e = u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2;
        var delta_f = u0*v1*y2 + v0*y1*u2 + y0*u1*v2 - y0*v1*u2
                - v0*u1*y2 - u0*y1*v2;
        ctx.transform(delta_a/delta, delta_d/delta,
                delta_b/delta, delta_e/delta,
                delta_c/delta, delta_f/delta);
        ctx.drawImage(texture, 0, 0);
        ctx.restore();
    }

    function map(p) {
        return [p[0] * 10, p[1] * 10];
    }

    function mapInv(p) {
        return [p[0] / 10, p[1] / 10];
    }

    console.log("initialized")
};