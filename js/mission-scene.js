/**
 * Cinematic Grok-style black hole + cosmic field.
 * Browser: <script src="js/mission-scene.js"> then MissionScene.boot().
 * Node tests load this file; exports are guarded.
 */
(function (root) {
    'use strict';

    var TWO_PI = Math.PI * 2;

    function blackHoleLayout(width, height, sceneRect) {
        var cx;
        var cy;
        var box;
        if (sceneRect && sceneRect.width > 0 && sceneRect.height > 0) {
            cx = sceneRect.left + sceneRect.width / 2;
            cy = sceneRect.top + sceneRect.height / 2;
            box = Math.min(sceneRect.width, sceneRect.height);
        } else {
            cx = width * 0.76;
            cy = height * 0.24;
            box = Math.min(width, height) * 0.42;
        }
        var R = box * 0.168;
        return {
            width: width,
            height: height,
            cx: cx,
            cy: cy,
            R: R,
            tilt: 1.18,
            flatten: 0.26,
            roll: -0.22,
            photonRingScale: 1.52,
            diskInnerScale: 1.72,
            diskOuterScale: 4.55,
            hasEventHorizon: true,
            hasAccretionDisk: true,
            hasPhotonRing: true,
            hasGravitationalLens: true,
            hasStarField: true,
            hasNebulaField: true
        };
    }

    function describeBlackHoleScene(layout) {
        var R = layout.R;
        return {
            eventHorizon: { cx: layout.cx, cy: layout.cy, r: R },
            accretionDisk: {
                cx: layout.cx,
                cy: layout.cy,
                inner: R * layout.diskInnerScale,
                outer: R * layout.diskOuterScale,
                tilt: layout.tilt,
                flatten: layout.flatten
            },
            photonRing: { cx: layout.cx, cy: layout.cy, r: R * layout.photonRingScale },
            gravitationalLens: {
                cx: layout.cx,
                cy: layout.cy,
                topOffset: R * 0.12,
                bottomOffset: R * 0.18,
                width: R * 3.1
            },
            starField: { present: true },
            nebulaField: { present: true }
        };
    }

    function sizeCanvases(canvases, width, height) {
        var i;
        for (i = 0; i < canvases.length; i++) {
            canvases[i].width = width;
            canvases[i].height = height;
        }
        return { width: width, height: height };
    }

    function createStarField(width, height) {
        var count = Math.max(180, Math.floor(width * height / 2800));
        var stars = [];
        var i;
        var roll;
        var temp;
        for (i = 0; i < count; i++) {
            roll = Math.random();
            if (roll > 0.86) {
                temp = [180, 210, 255];
            } else if (roll > 0.72) {
                temp = [255, 220, 180];
            } else {
                temp = [255, 255, 255];
            }
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: roll > 0.93 ? Math.random() * 1.8 + 1.1 : Math.random() * 1.15 + 0.25,
                opacity: Math.random() * 0.55 + 0.22,
                twinkle: Math.random() * TWO_PI,
                speed: Math.random() * 0.18 + 0.02,
                color: temp,
                spike: roll > 0.965
            });
        }
        return stars;
    }

    function createNebulaField(width, height) {
        return [
            { x: width * 0.12, y: height * 0.18, rx: width * 0.38, ry: height * 0.28, color: [150, 70, 230], phase: 0.2 },
            { x: width * 0.78, y: height * 0.22, rx: width * 0.32, ry: height * 0.26, color: [255, 110, 50], phase: 1.1 },
            { x: width * 0.72, y: height * 0.62, rx: width * 0.3, ry: height * 0.3, color: [40, 110, 230], phase: 2.4 },
            { x: width * 0.38, y: height * 0.72, rx: width * 0.34, ry: height * 0.24, color: [90, 50, 170], phase: 3.3 },
            { x: width * 0.5, y: height * 0.4, rx: width * 0.24, ry: height * 0.18, color: [200, 80, 160], phase: 4.6 },
            { x: width * 0.88, y: height * 0.38, rx: width * 0.2, ry: height * 0.16, color: [255, 170, 90], phase: 5.5 }
        ];
    }

    function drawNebulaField(ctx, clouds, t) {
        var i;
        var cloud;
        var cx;
        var cy;
        var grad;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (i = 0; i < clouds.length; i++) {
            cloud = clouds[i];
            cx = cloud.x + Math.sin(t * 0.22 + cloud.phase) * 28;
            cy = cloud.y + Math.cos(t * 0.16 + cloud.phase) * 18;
            grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cloud.rx, cloud.ry));
            grad.addColorStop(0, 'rgba(' + cloud.color[0] + ',' + cloud.color[1] + ',' + cloud.color[2] + ',0.16)');
            grad.addColorStop(0.4, 'rgba(' + cloud.color[0] + ',' + Math.round(cloud.color[1] * 0.85) + ',' + cloud.color[2] + ',0.07)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, cloud.rx, cloud.ry, t * 0.04 + cloud.phase * 0.15, 0, TWO_PI);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawStarField(ctx, stars, t, height, width) {
        var i;
        var s;
        var flicker;
        var a;
        for (i = 0; i < stars.length; i++) {
            s = stars[i];
            flicker = 0.55 + 0.45 * Math.sin(t * 2.1 + s.twinkle);
            a = s.opacity * flicker;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
            ctx.fillStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',' + a + ')';
            ctx.fill();
            if (s.spike) {
                ctx.save();
                ctx.globalAlpha = a * 0.55;
                ctx.strokeStyle = 'rgba(' + s.color[0] + ',' + s.color[1] + ',' + s.color[2] + ',1)';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(s.x - s.r * 5, s.y);
                ctx.lineTo(s.x + s.r * 5, s.y);
                ctx.moveTo(s.x, s.y - s.r * 5);
                ctx.lineTo(s.x, s.y + s.r * 5);
                ctx.stroke();
                ctx.restore();
            }
            if (typeof height === 'number' && typeof width === 'number') {
                s.y += s.speed;
                if (s.y > height) {
                    s.y = 0;
                    s.x = Math.random() * width;
                }
            }
        }
    }

    function drawEventHorizon(ctx, layout) {
        var R = layout.R;
        var falloff = ctx.createRadialGradient(layout.cx, layout.cy, R * 0.35, layout.cx, layout.cy, R * 1.18);
        falloff.addColorStop(0, '#000000');
        falloff.addColorStop(0.72, '#000000');
        falloff.addColorStop(0.9, 'rgba(4,6,12,0.95)');
        falloff.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(layout.cx, layout.cy, R * 1.12, 0, TWO_PI);
        ctx.fillStyle = falloff;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(layout.cx, layout.cy, R, 0, TWO_PI);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }

    function drawPhotonRing(ctx, layout, t) {
        var R = layout.R * layout.photonRingScale;
        var pulse = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.7));
        ctx.save();
        ctx.translate(layout.cx, layout.cy);
        ctx.strokeStyle = 'rgba(255, 236, 210, ' + (0.88 * pulse) + ')';
        ctx.lineWidth = Math.max(1.6, layout.R * 0.055);
        ctx.shadowColor = 'rgba(255, 170, 80, 0.95)';
        ctx.shadowBlur = layout.R * 0.42;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, TWO_PI);
        ctx.stroke();

        ctx.shadowBlur = layout.R * 0.16;
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.55 * pulse) + ')';
        ctx.lineWidth = Math.max(0.8, layout.R * 0.018);
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 0.99, R * 0.985, 0, 0, TWO_PI);
        ctx.stroke();
        ctx.restore();
    }

    function drawAccretionDisk(ctx, layout, t) {
        var inner = layout.R * layout.diskInnerScale;
        var outer = layout.R * layout.diskOuterScale;
        var flatten = layout.flatten;
        var spin = t * 0.35;
        var ring;
        var u;
        var rad;
        var body;
        var hot;
        ctx.save();
        ctx.translate(layout.cx, layout.cy);
        ctx.rotate(layout.roll);
        ctx.scale(1, flatten);
        ctx.globalCompositeOperation = 'lighter';

        body = ctx.createRadialGradient(0, 0, inner * 0.85, 0, 0, outer);
        body.addColorStop(0, 'rgba(255, 210, 150, 0)');
        body.addColorStop(0.08, 'rgba(255, 190, 110, 0.22)');
        body.addColorStop(0.28, 'rgba(255, 140, 50, 0.38)');
        body.addColorStop(0.62, 'rgba(200, 70, 30, 0.16)');
        body.addColorStop(1, 'rgba(80, 20, 40, 0)');
        ctx.beginPath();
        ctx.arc(0, 0, outer, 0, TWO_PI);
        ctx.arc(0, 0, inner, 0, TWO_PI, true);
        ctx.fillStyle = body;
        ctx.fill();

        hot = ctx.createLinearGradient(-outer, 0, outer, 0);
        hot.addColorStop(0, 'rgba(90, 40, 140, 0.05)');
        hot.addColorStop(0.32, 'rgba(255, 110, 40, 0.08)');
        hot.addColorStop(0.5, 'rgba(255, 240, 210, 0.42)');
        hot.addColorStop(0.68, 'rgba(255, 140, 50, 0.12)');
        hot.addColorStop(1, 'rgba(40, 60, 140, 0.05)');
        ctx.beginPath();
        ctx.arc(0, 0, outer, 0, TWO_PI);
        ctx.arc(0, 0, inner, 0, TWO_PI, true);
        ctx.fillStyle = hot;
        ctx.fill();

        for (ring = 0; ring < 10; ring++) {
            u = ring / 9;
            rad = inner + (outer - inner) * (0.12 + u * 0.8);
            ctx.lineWidth = Math.max(1.2, layout.R * (0.035 - u * 0.018));
            ctx.strokeStyle = 'rgba(255, ' + Math.round(200 - u * 80) + ', ' + Math.round(120 - u * 50) + ', ' + (0.06 + 0.05 * (1 - u)) + ')';
            ctx.beginPath();
            ctx.arc(0, 0, rad, -0.45 + spin * 0.05, 1.05 + spin * 0.05);
            ctx.stroke();
        }

        ctx.restore();

        ctx.save();
        ctx.translate(layout.cx, layout.cy);
        ctx.rotate(layout.roll);
        ctx.globalCompositeOperation = 'lighter';
        var i;
        for (i = 0; i < 70; i++) {
            var ang = (i / 70) * TWO_PI + spin;
            var dist = inner + (outer - inner) * (0.18 + 0.7 * ((i * 13) % 10) / 10);
            var px = Math.cos(ang) * dist;
            var py = Math.sin(ang) * dist * flatten;
            var doppler = 0.5 + 0.5 * Math.cos(ang);
            ctx.beginPath();
            ctx.arc(px, py, 0.8 + doppler * 1.4, 0, TWO_PI);
            ctx.fillStyle = doppler > 0.6
                ? 'rgba(255, 236, 200, ' + (0.16 + doppler * 0.3) + ')'
                : 'rgba(160, 70, 255, ' + (0.06 + (1 - doppler) * 0.08) + ')';
            ctx.fill();
        }
        ctx.restore();
    }

    function drawGravitationalLens(ctx, layout, t) {
        var R = layout.R;
        var flicker = 0.85 + 0.15 * Math.sin(t * 1.4);
        var topGrad;
        var botGrad;
        ctx.save();
        ctx.translate(layout.cx, layout.cy);
        ctx.rotate(layout.roll * 0.45);

        topGrad = ctx.createLinearGradient(-R * 3.2, 0, R * 3.2, 0);
        topGrad.addColorStop(0, 'rgba(255,140,60,0)');
        topGrad.addColorStop(0.28, 'rgba(255,120,40,' + (0.16 * flicker) + ')');
        topGrad.addColorStop(0.5, 'rgba(255,236,210,' + (0.55 * flicker) + ')');
        topGrad.addColorStop(0.7, 'rgba(255,150,70,' + (0.2 * flicker) + ')');
        topGrad.addColorStop(1, 'rgba(255,140,60,0)');
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.ellipse(0, -R * 0.12, R * 3.05, R * 0.42, 0, Math.PI, 0);
        ctx.fill();

        botGrad = ctx.createLinearGradient(-R * 2.6, 0, R * 2.6, 0);
        botGrad.addColorStop(0, 'rgba(200,80,255,0)');
        botGrad.addColorStop(0.5, 'rgba(255,150,80,' + (0.22 * flicker) + ')');
        botGrad.addColorStop(1, 'rgba(80,120,255,0)');
        ctx.fillStyle = botGrad;
        ctx.beginPath();
        ctx.ellipse(0, R * 0.16, R * 2.55, R * 0.32, 0, 0, Math.PI);
        ctx.fill();

        ctx.restore();
    }

    function drawCinematicBlackHole(ctx, layout, t) {
        var halo = ctx.createRadialGradient(layout.cx, layout.cy, layout.R * 0.6, layout.cx, layout.cy, layout.R * 6.2);
        halo.addColorStop(0, 'rgba(120, 60, 200, 0.14)');
        halo.addColorStop(0.35, 'rgba(255, 110, 40, 0.07)');
        halo.addColorStop(0.7, 'rgba(40, 80, 180, 0.04)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(layout.cx - layout.R * 6.2, layout.cy - layout.R * 6.2, layout.R * 12.4, layout.R * 12.4);

        drawAccretionDisk(ctx, layout, t);
        drawGravitationalLens(ctx, layout, t);
        drawPhotonRing(ctx, layout, t);
        drawEventHorizon(ctx, layout);
    }

    function bootMissionScene() {
        if (typeof document === 'undefined') {
            return null;
        }

        var nebulaCanvas = document.getElementById('nebula-canvas');
        var bhCanvas = document.getElementById('blackhole-canvas');
        var starCanvas = document.getElementById('starfield');
        if (!nebulaCanvas || !bhCanvas || !starCanvas) {
            return null;
        }

        var nebulaCtx = nebulaCanvas.getContext('2d');
        var bhCtx = bhCanvas.getContext('2d');
        var starCtx = starCanvas.getContext('2d');
        var stars = [];
        var clouds = [];
        var width = 0;
        var height = 0;
        var running = true;

        function currentLayout() {
            var scene = document.querySelector('.black-hole-scene');
            var rect = scene ? scene.getBoundingClientRect() : null;
            return blackHoleLayout(width, height, rect);
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            sizeCanvases([nebulaCanvas, bhCanvas, starCanvas], width, height);
            stars = createStarField(width, height);
            clouds = createNebulaField(width, height);
        }

        function frame() {
            if (!running) {
                return;
            }
            var t = Date.now() * 0.001;
            nebulaCtx.clearRect(0, 0, width, height);
            bhCtx.clearRect(0, 0, width, height);
            starCtx.clearRect(0, 0, width, height);
            drawNebulaField(nebulaCtx, clouds, t);
            drawCinematicBlackHole(bhCtx, currentLayout(), t);
            drawStarField(starCtx, stars, t, height, width);
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(frame);
            }
        }

        resize();
        frame();
        window.addEventListener('resize', resize);

        return {
            resize: resize,
            stop: function () { running = false; },
            getLayout: currentLayout
        };
    }

    var api = {
        blackHoleLayout: blackHoleLayout,
        describeBlackHoleScene: describeBlackHoleScene,
        sizeCanvases: sizeCanvases,
        createStarField: createStarField,
        createNebulaField: createNebulaField,
        drawEventHorizon: drawEventHorizon,
        drawAccretionDisk: drawAccretionDisk,
        drawPhotonRing: drawPhotonRing,
        drawGravitationalLens: drawGravitationalLens,
        drawStarField: drawStarField,
        drawNebulaField: drawNebulaField,
        drawCinematicBlackHole: drawCinematicBlackHole,
        boot: bootMissionScene
    };

    root.MissionScene = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
