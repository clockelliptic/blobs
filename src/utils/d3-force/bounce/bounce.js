//https://github.com/vasturiano/d3-force-surface
import { quadtree } from 'd3-quadtree';
import constant from './constant';

export default function() {
    let nodes,
        elasticity = 1,                                 // 0 <= number <= 1
        radius = (node => 1),                           // accessor: number > 0
        mass = (node => Math.pow(radius(node), 2)),     // accessor: number > 0 (Mass proportional to area by default)
        onImpact;                                       // (node, node) callback

    function force() {

        const tree = quadtree(nodes, d=>d.x, d=>d.y).visitAfter((quad) => {
            if (quad.data) return quad.r = radius(quad.data);
            for (let i = quad.r = 0; i < 4; ++i) {
                if (quad[i] && quad[i].r > quad.r) {
                    quad.r = quad[i].r; // Store largest radius per tree node
                }
            }
        });

        nodes.forEach(a => {
            const ra = radius(a);

            tree.visit((quad, x0, y0, x1, y1) => {

                const b = quad.data,
                    rb = quad.r,
                    minDistance = ra + rb;

                if (b) { // Leaf tree node
                    if (b.index > a.index) { // Prevent visiting same node pair more than once

                        if (a.x === b.x && a.y === b.y) {
                            // Totally overlap > jiggle b
                            const jiggleVect = polar2Cart(1e-6, Math.random() * 2 * Math.PI);
                            b.x += jiggleVect.x;
                            b.y += jiggleVect.y;
                        }

                        const impactVect = cart2Polar(b.x-a.x, b.y-a.y), // Impact vector from a > b
                            overlap = Math.max(0, minDistance - impactVect.d);

                        if (!overlap) return; // No collision

                        const vaRel = rotatePnt({x: a.vx, y: a.vy}, -impactVect.a), // x is the velocity along the impact line, y is tangential
                            vbRel = rotatePnt({x: b.vx, y: b.vy}, -impactVect.a);

                        // Transfer velocities along the direct line of impact (tangential remain the same)
                        ({ a: vaRel.x, b: vbRel.x } = getAfterImpactVelocities(mass(a), mass(b), vaRel.x, vbRel.x, elasticity));

                        // Convert back to original plane
                        ({ x: a.vx, y: a.vy } = rotatePnt(vaRel, impactVect.a));
                        ({ x: b.vx, y: b.vy } = rotatePnt(vbRel, impactVect.a));

                        // Split them apart
                        const nudge = polar2Cart(overlap, impactVect.a),
                            nudgeBias = ra/(ra+rb); // Weight of nudge to apply to B
                        a.x -= nudge.x * (1-nudgeBias); a.y -= nudge.y * (1-nudgeBias);
                        b.x += nudge.x * nudgeBias; b.y += nudge.y * nudgeBias;

                        onImpact && onImpact(a, b);
                    }
                    return;
                }

                // Only keep traversing sub-tree quadrants if radius overlaps
                return x0 > a.x + minDistance || x1 < a.x - minDistance || y0 > a.y + minDistance || y1 < a.y - minDistance;
            });
        });

        //

        function getAfterImpactVelocities(ma, mb, va, vb, elasticity = 1) {
            // Apply momentum conservation equation with coefficient of restitution (elasticity)
            return {
                a: (elasticity*mb*(vb-va) + ma*va + mb*vb) / (ma+mb),
                b: (elasticity*ma*(va-vb) + ma*va + mb*vb) / (ma+mb)
            }
        }

        function rotatePnt({x, y}, a) {
            const vect = cart2Polar(x, y);
            return polar2Cart(vect.d, vect.a + a);
        }

        function cart2Polar(x, y) {
            x = x||0; // Normalize -0 to 0 to avoid -Infinity issues in atan
            return {
                d: Math.sqrt(x*x + y*y),
                a: (x === 0 && y === 0) ? 0 : Math.atan(y/x) + (x<0 ? Math.PI : 0) // Add PI for coords in 2nd & 3rd quadrants
            }
        }

        function polar2Cart(d, a) {
            return {
                x: d * Math.cos(a),
                y: d * Math.sin(a)
            }
        }
    }

    function initialize() {}

    force.initialize = function(_) {
        nodes = _;
        initialize();
    };

    force.elasticity = function(_) {
        return arguments.length ? (elasticity = _, force) : elasticity;
    };

    force.radius = function(_) {
        return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), force) : radius;
    };

    force.mass = function(_) {
        return arguments.length ? (mass = typeof _ === "function" ? _ : constant(+_), force) : mass;
    };

    force.onImpact = function(_) {
        return arguments.length ? (onImpact = _, force) : onImpact;
    };

    return force;
}