/**
 * Hero event horizon and starfield.
 *
 * Original artwork: an inclined, nearly edge-on accretion disk crossing in
 * front of a black shadow, a thin photon ring, and the lensed image of the far
 * disk arching over the top. Palette is near-monochrome (white-hot light on a
 * black void) with a faint warm ember toward the outer disk.
 *
 * Detail is baked once into textures (time-sliced so loading never blocks),
 * then each frame only rotates and composites them, which keeps it at 60fps.
 */
(function (root) {
    'use strict';

    var TAU = Math.PI * 2;

    var PALETTE = {
        hot: [255, 255, 255],
        pearl: [236, 240, 248],
        silver: [190, 199, 216],
        ember: [231, 97, 19],
        rim: [170, 198, 255]
    };

    // All radii are in units of the shadow radius R.
    var SHAPE = {
        horizon: 0.162,
        roll: -0.2,
        flatten: 0.235,
        diskInner: 1.42,
        diskOuter: 3.95,
        lensInner: 1.075,
        lensTop: 1.9,
        lensBottom: 1.26,
        lensExtent: 2.0,
        outerRing: 1.5,
        coreExtent: 1.62,
        spinRate: 0.00013,
        spinStart: 2.35
    };

    // Animated canvas half-extent, in R. Covers the rolled disk and the arc.
    var FRAME = {
        halfWidth: 4.05,
        halfHeight: 2.3
    };

    function clamp01(x) {
        return x < 0 ? 0 : (x > 1 ? 1 : x);
    }

    function smoothstep(a, b, x) {
        var t = clamp01((x - a) / (b - a));
        return t * t * (3 - 2 * t);
    }

    function mix(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t
        ];
    }

    function prng(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) >>> 0;
            var t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Smooth 1D value noise over [0, 1), summed octaves, normalised to 0..1.
    function makeNoise1D(seed, cells, octaves) {
        var rand = prng(seed);
        var layers = [];
        var o;
        var i;
        var n;
        for (o = 0; o < octaves; o++) {
            n = cells * Math.pow(2, o);
            var vals = new Float32Array(n + 1);
            for (i = 0; i <= n; i++) {
                vals[i] = rand();
            }
            layers.push(vals);
        }
        return function (x) {
            var sum = 0;
            var norm = 0;
            var amp = 1;
            var k;
            for (k = 0; k < layers.length; k++) {
                var v = layers[k];
                var len = v.length - 1;
                var p = clamp01(x) * len;
                var i0 = Math.min(len - 1, Math.floor(p));
                var f = p - i0;
                f = f * f * (3 - 2 * f);
                sum += (v[i0] + (v[i0 + 1] - v[i0]) * f) * amp;
                norm += amp;
                amp *= 0.55;
            }
            return sum / norm;
        };
    }

    // 2D value noise in (radius 0..1, angle), periodic in angle. Cells are
    // stretched along the angle so features read as orbiting streaks.
    function makeStreakNoise(seed, radialCells, angularCells) {
        var rand = prng(seed);
        var grid = new Float32Array((radialCells + 1) * angularCells);
        var i;
        for (i = 0; i < grid.length; i++) {
            grid[i] = rand();
        }
        function at(r, a) {
            return grid[r * angularCells + ((a % angularCells) + angularCells) % angularCells];
        }
        return function (u, theta) {
            var pr = clamp01(u) * radialCells;
            var pa = ((theta / TAU) % 1 + 1) % 1 * angularCells;
            var r0 = Math.min(radialCells - 1, Math.floor(pr));
            var a0 = Math.floor(pa);
            var fr = pr - r0;
            var fa = pa - a0;
            fr = fr * fr * (3 - 2 * fr);
            fa = fa * fa * (3 - 2 * fa);
            var top = at(r0, a0) + (at(r0, a0 + 1) - at(r0, a0)) * fa;
            var bot = at(r0 + 1, a0) + (at(r0 + 1, a0 + 1) - at(r0 + 1, a0)) * fa;
            return top + (bot - top) * fr;
        };
    }

    function createNoise() {
        return {
            bands: makeNoise1D(7, 60, 4),
            fine: makeNoise1D(19, 260, 2),
            streak: makeStreakNoise(31, 46, 22),
            wisp: makeStreakNoise(43, 18, 9)
        };
    }

    // The slow traveling highlight; rotates with the disk.
    function sweep(theta) {
        var lobe = Math.pow(0.5 + 0.5 * Math.cos(theta), 2.4);
        return 0.62 + 0.38 * lobe;
    }

    function diskColor(u) {
        var t = clamp01((u - SHAPE.diskInner) / (SHAPE.diskOuter - SHAPE.diskInner));
        var c = mix(PALETTE.hot, PALETTE.pearl, smoothstep(0.0, 0.18, t));
        c = mix(c, PALETTE.silver, smoothstep(0.18, 0.55, t));
        return mix(c, PALETTE.ember, smoothstep(0.42, 0.95, t) * 0.62);
    }

    // Face-on accretion disk sample: u = r / R, theta in the disk plane.
    function diskSample(u, theta, noise) {
        var inner = SHAPE.diskInner;
        var outer = SHAPE.diskOuter;
        if (u < inner * 0.96 || u > outer) {
            return [0, 0, 0, 0];
        }
        var t = (u - inner) / (outer - inner);
        var edge = smoothstep(inner * 0.965, inner * 1.035, u);
        var fall = Math.pow(inner * 1.03 / Math.max(u, inner * 1.03), 1.75);
        var fade = 1 - smoothstep(0.5, 1, t);
        var bands = 0.66 + 0.34 * noise.bands(t);
        var fine = 0.86 + 0.14 * noise.fine(t);
        var streak = 0.5 + 0.5 * noise.streak(t, theta);
        var wisp = 0.8 + 0.2 * noise.wisp(t, theta * 2);
        var s = sweep(theta);
        var core = edge * fall * fade * bands * fine * streak * wisp * s;
        var glow = edge * 0.3 * Math.exp(-t * 3.4) * fade * s;
        var heat = edge * 0.35 * Math.exp(-t * 9) * s;
        var a = clamp01(core * 1.45 + glow + heat);
        var c = diskColor(u);
        return [c[0], c[1], c[2], a];
    }

    // Lensed far-disk image, sampled in the screen frame (y down, rolled with
    // the disk). Thick arc over the top, a thin secondary arc underneath.
    function lensMask(u, angle) {
        var inner = SHAPE.lensInner;
        if (u < inner * 0.985) {
            return 0;
        }
        var up = Math.max(0, -Math.sin(angle));
        var down = Math.max(0, Math.sin(angle));
        var side = inner + 0.075;
        var outer = side
            + (SHAPE.lensTop - side) * Math.pow(up, 1.35)
            + (SHAPE.lensBottom - side) * Math.pow(down, 1.5);
        var t = (u - inner) / (outer - inner);
        if (t >= 1) {
            return 0;
        }
        var edge = smoothstep(inner * 0.985, inner * 1.02, u);
        var body = Math.pow(1 - clamp01(t), 1.25) * (0.52 + 0.48 * Math.exp(-t * 2.6));
        var strength = 0.9 + 0.3 * up - 0.32 * down;
        return clamp01(edge * body * strength);
    }

    function lensSample(u, theta, noise) {
        var t = clamp01((u - 1) / (SHAPE.lensExtent - 1));
        var bands = 0.6 + 0.4 * noise.bands(0.15 + t * 0.6);
        var streak = 0.74 + 0.26 * noise.wisp(t, theta);
        var a = clamp01(bands * streak * (0.35 + 0.65 * sweep(theta)) * 1.45);
        var c = mix(PALETTE.hot, PALETTE.pearl, smoothstep(0.05, 0.35, t));
        c = mix(c, PALETTE.ember, smoothstep(0.35, 0.95, t) * 0.4);
        return [c[0], c[1], c[2], a];
    }

    function shadowSample(u) {
        return 1 - smoothstep(0.975, 1.0, u);
    }

    // Photon ring hugging the shadow plus a fainter outer ring separated by a
    // dark gap, in the screen frame; both brightest beneath the lensed arc.
    function ringSample(u, angle) {
        var up = Math.max(0, -Math.sin(angle || 0));
        var down = Math.max(0, Math.sin(angle || 0));
        var d = (u - 1.005) / 0.0062;
        var line = Math.exp(-d * d);
        var g = (u - 1.0) / 0.04;
        var halo = u > 0.99 ? 0.2 * Math.exp(-g * g) : 0;
        var wide = u > 0.995 ? 0.07 * Math.exp(-(u - 1) / 0.14) : 0;
        var gain = 0.62 + 0.38 * up + 0.12 * down;
        var o = (u - SHAPE.outerRing) / 0.0075;
        var oh = (u - SHAPE.outerRing) / 0.05;
        var outer = (Math.exp(-o * o) * 0.62 + Math.exp(-oh * oh) * 0.12) * (0.4 + 0.6 * up + 0.1 * down);
        var a = (line + halo + wide) * gain + outer;
        var c = mix(PALETTE.rim, PALETTE.hot, clamp01(0.55 + line + outer));
        return [c[0], c[1], c[2], clamp01(a)];
    }

    /**
     * Fill an RGBA buffer of size x size covering radius `extent` (in R).
     * sampler(u, theta) returns [r, g, b, a(0..1)] or a number (alpha,
     * white). Processes rows from `fromRow` until `budgetMs` is spent and
     * returns the next row to process.
     */
    function fillTexture(image, size, extent, sampler, fromRow, budgetMs) {
        var data = image.data;
        var half = size / 2;
        var scale = extent / half;
        var start = Date.now();
        var y = fromRow || 0;
        var x;
        var dx;
        var dy;
        var u;
        var theta;
        var s;
        var i;
        for (; y < size; y++) {
            dy = (y + 0.5 - half) * scale;
            for (x = 0; x < size; x++) {
                dx = (x + 0.5 - half) * scale;
                u = Math.sqrt(dx * dx + dy * dy);
                i = (y * size + x) * 4;
                if (u > extent) {
                    data[i + 3] = 0;
                    continue;
                }
                theta = Math.atan2(dy, dx);
                s = sampler(u, theta);
                if (typeof s === 'number') {
                    data[i] = 255;
                    data[i + 1] = 255;
                    data[i + 2] = 255;
                    data[i + 3] = Math.round(clamp01(s) * 255);
                } else {
                    data[i] = s[0];
                    data[i + 1] = s[1];
                    data[i + 2] = s[2];
                    data[i + 3] = Math.round(clamp01(s[3]) * 255);
                }
            }
            if (budgetMs && Date.now() - start > budgetMs) {
                return y + 1;
            }
        }
        return size;
    }

    function geometry(boxWidth, dpr) {
        var R = boxWidth * SHAPE.horizon * dpr;
        return {
            R: R,
            diskRadius: R * SHAPE.diskOuter,
            lensRadius: R * SHAPE.lensExtent,
            coreRadius: R * SHAPE.coreExtent,
            roll: SHAPE.roll,
            flatten: SHAPE.flatten
        };
    }

    function textureSizes(geo) {
        function even(n, lo, hi) {
            return Math.max(lo, Math.min(hi, Math.ceil(n / 2) * 2));
        }
        return {
            disk: even(geo.diskRadius * 2 * 0.92, 512, 1800),
            lens: even(geo.lensRadius * 2, 256, 1000),
            core: even(geo.coreRadius * 2, 192, 900)
        };
    }

    function spinAt(time) {
        return SHAPE.spinStart + (time || 0) * SHAPE.spinRate;
    }

    function boot() {
        var doc = root.document;
        var starCanvas = doc.getElementById('starfield');
        var hole = doc.getElementById('blackhole');
        var hero = doc.getElementById('top');
        var bgCanvas = doc.getElementById('bh-glow');
        var fgCanvas = doc.getElementById('bh-canvas');
        var reduce = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var heroVisible = true;
        var scrollTicking = false;
        var stars = [];
        var vw = 0;
        var vh = 0;
        var starDpr = 1;
        var scene = null;
        var building = null;
        var noise = null;

        function rand(a, b) {
            return a + Math.random() * (b - a);
        }

        function makeStars() {
            var count = Math.max(70, Math.min(160, Math.floor(vw * vh / 14000)));
            var i;
            var roll;
            stars = [];
            for (i = 0; i < count; i++) {
                roll = Math.random();
                stars.push({
                    x: Math.random() * vw,
                    y: Math.random() * vh,
                    r: roll > 0.94 ? rand(1.1, 1.7) : rand(0.3, 0.9),
                    a: rand(0.15, 0.55),
                    phase: Math.random() * TAU,
                    cool: roll > 0.82
                });
            }
        }

        function resizeStars() {
            if (!starCanvas) {
                return;
            }
            vw = root.innerWidth;
            vh = root.innerHeight;
            starDpr = Math.min(root.devicePixelRatio || 1, 2);
            starCanvas.width = Math.floor(vw * starDpr);
            starCanvas.height = Math.floor(vh * starDpr);
            starCanvas.style.width = vw + 'px';
            starCanvas.style.height = vh + 'px';
            makeStars();
        }

        function drawStars(t) {
            if (!starCanvas || !starCanvas.getContext) {
                return;
            }
            var ctx = starCanvas.getContext('2d');
            var i;
            var s;
            var alpha;
            ctx.setTransform(starDpr, 0, 0, starDpr, 0, 0);
            ctx.clearRect(0, 0, vw, vh);
            for (i = 0; i < stars.length; i++) {
                s = stars[i];
                alpha = s.a;
                if (!reduce) {
                    alpha *= 0.72 + 0.28 * Math.sin(t * 0.001 + s.phase);
                }
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.fillStyle = s.cool ? '#c5d8ff' : '#f5f7fb';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, TAU);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        function makeCanvas(w, h) {
            var c = doc.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
        }

        // The animated canvas only spans the disk and lensed arc; the wide
        // ambient glow lives on a static canvas behind it.
        function measure() {
            var dpr = Math.min(root.devicePixelRatio || 1, 2);
            var boxWidth = hole.offsetWidth;
            var R = geometry(boxWidth, 1).R;
            var cssW = Math.ceil(R * FRAME.halfWidth * 2);
            var cssH = Math.ceil(R * FRAME.halfHeight * 2);
            fgCanvas.style.width = cssW + 'px';
            fgCanvas.style.height = cssH + 'px';
            var glow = bgCanvas.getBoundingClientRect();
            return {
                dpr: dpr,
                boxWidth: boxWidth,
                width: Math.max(1, Math.round(cssW * dpr)),
                height: Math.max(1, Math.round(cssH * dpr)),
                glowWidth: Math.max(1, Math.round(glow.width * dpr)),
                glowHeight: Math.max(1, Math.round(glow.height * dpr))
            };
        }

        function paintGlow(target, geo, w, h) {
            var ctx = target.getContext('2d');
            var R = geo.R;
            var g;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.translate(w / 2, h / 2);
            ctx.rotate(geo.roll);

            ctx.save();
            ctx.scale(1, 0.56);
            g = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 5.4);
            g.addColorStop(0, 'rgba(236, 241, 250, 0.16)');
            g.addColorStop(0.16, 'rgba(214, 224, 244, 0.075)');
            g.addColorStop(0.42, 'rgba(231, 97, 19, 0.032)');
            g.addColorStop(1, 'rgba(231, 97, 19, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, R * 5.4, 0, TAU);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.scale(1, geo.flatten * 1.35);
            g = ctx.createRadialGradient(0, 0, R * 1.2, 0, 0, geo.diskRadius * 1.08);
            g.addColorStop(0, 'rgba(255, 255, 255, 0)');
            g.addColorStop(0.12, 'rgba(240, 244, 252, 0.2)');
            g.addColorStop(0.4, 'rgba(214, 224, 244, 0.07)');
            g.addColorStop(0.75, 'rgba(231, 97, 19, 0.025)');
            g.addColorStop(1, 'rgba(231, 97, 19, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, geo.diskRadius * 1.08, 0, TAU);
            ctx.fill();
            ctx.restore();

            g = ctx.createRadialGradient(0, -R * 0.12, R * 0.95, 0, -R * 0.12, R * 2.6);
            g.addColorStop(0, 'rgba(244, 247, 255, 0.2)');
            g.addColorStop(0.3, 'rgba(220, 230, 250, 0.08)');
            g.addColorStop(1, 'rgba(220, 230, 250, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, -R * 0.12, R * 2.6, 0, TAU);
            ctx.fill();

            ctx.save();
            ctx.scale(1, 0.045);
            g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 5.2);
            g.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
            g.addColorStop(0.35, 'rgba(226, 234, 250, 0.07)');
            g.addColorStop(1, 'rgba(226, 234, 250, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, R * 5.2, 0, TAU);
            ctx.fill();
            ctx.restore();
        }

        // Builds every texture in small slices across frames.
        function build(m, done) {
            var geo = geometry(m.boxWidth, m.dpr);
            var sizes = textureSizes(geo);
            if (!noise) {
                noise = createNoise();
            }
            var disk = makeCanvas(sizes.disk, sizes.disk);
            var lensTex = makeCanvas(sizes.lens, sizes.lens);
            var lensMaskTex = makeCanvas(sizes.lens, sizes.lens);
            var shadow = makeCanvas(sizes.core, sizes.core);
            var ring = makeCanvas(sizes.core, sizes.core);
            var jobs = [
                [disk, SHAPE.diskOuter, function (u, th) { return diskSample(u, th, noise); }],
                [lensTex, SHAPE.lensExtent, function (u, th) { return lensSample(u, th, noise); }],
                [lensMaskTex, SHAPE.lensExtent, function (u, th) { return lensMask(u, th); }],
                [shadow, SHAPE.coreExtent, function (u) { return [0, 0, 0, shadowSample(u)]; }],
                [ring, SHAPE.coreExtent, function (u, th) { return ringSample(u, th); }]
            ];
            var job = 0;
            var row = 0;
            var image = null;
            var cancelled = false;

            function step() {
                if (cancelled) {
                    return;
                }
                var started = Date.now();
                while (job < jobs.length && Date.now() - started < 10) {
                    var target = jobs[job][0];
                    var ctx = target.getContext('2d');
                    if (!image) {
                        image = ctx.createImageData(target.width, target.height);
                        row = 0;
                    }
                    row = fillTexture(image, target.width, jobs[job][1], jobs[job][2], row, 8);
                    if (row >= target.width) {
                        ctx.putImageData(image, 0, 0);
                        image = null;
                        job++;
                    }
                }
                if (job < jobs.length) {
                    root.setTimeout(step, 0);
                    return;
                }
                done({
                    geo: geo,
                    disk: disk,
                    lensTex: lensTex,
                    lensMask: lensMaskTex,
                    lens: makeCanvas(sizes.lens, sizes.lens),
                    shadow: shadow,
                    ring: ring
                });
            }
            root.setTimeout(step, 0);
            return {
                cancel: function () { cancelled = true; }
            };
        }

        function layout(m) {
            fgCanvas.width = m.width;
            fgCanvas.height = m.height;
            bgCanvas.width = m.glowWidth;
            bgCanvas.height = m.glowHeight;
            if (scene) {
                scene.geo = geometry(m.boxWidth, m.dpr);
                paintGlow(bgCanvas, scene.geo, m.glowWidth, m.glowHeight);
            }
        }

        function drawDiskHalf(ctx, s, cx, cy, spin, near) {
            var geo = s.geo;
            var d = geo.diskRadius;
            var big = d * 1.2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(geo.roll);
            ctx.beginPath();
            if (near) {
                ctx.rect(-big, 0, big * 2, big);
            } else {
                ctx.rect(-big, -big, big * 2, big);
            }
            ctx.clip();
            ctx.scale(1, geo.flatten);
            ctx.rotate(spin);
            ctx.drawImage(s.disk, -d, -d, d * 2, d * 2);
            ctx.restore();
        }

        function composeLens(s, spin) {
            var lens = s.lens;
            var size = lens.width;
            var lctx = lens.getContext('2d');
            lctx.setTransform(1, 0, 0, 1, 0, 0);
            lctx.globalCompositeOperation = 'source-over';
            lctx.clearRect(0, 0, size, size);
            lctx.drawImage(s.lensMask, 0, 0);
            lctx.globalCompositeOperation = 'source-in';
            lctx.translate(size / 2, size / 2);
            lctx.rotate(spin);
            lctx.drawImage(s.lensTex, -size / 2, -size / 2);
        }

        function render(time) {
            if (!scene) {
                return;
            }
            var s = scene;
            var ctx = fgCanvas.getContext('2d');
            var w = fgCanvas.width;
            var h = fgCanvas.height;
            var cx = w / 2;
            var cy = h / 2;
            var geo = s.geo;
            var spin = spinAt(time);
            var shimmer = reduce ? 1 : 0.93 + 0.07 * Math.sin((time || 0) * 0.0006);
            var lr = geo.lensRadius;
            var cr = geo.coreRadius;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, w, h);

            ctx.globalCompositeOperation = 'lighter';
            drawDiskHalf(ctx, s, cx, cy, spin, false);

            composeLens(s, spin);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(geo.roll);
            ctx.drawImage(s.lens, -lr, -lr, lr * 2, lr * 2);
            ctx.restore();

            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(s.shadow, cx - cr, cy - cr, cr * 2, cr * 2);

            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = shimmer;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(geo.roll);
            ctx.drawImage(s.ring, -cr, -cr, cr * 2, cr * 2);
            ctx.restore();
            ctx.globalAlpha = 1;

            drawDiskHalf(ctx, s, cx, cy, spin, true);
            ctx.globalCompositeOperation = 'source-over';
        }

        function start() {
            var m = measure();
            if (building) {
                building.cancel();
            }
            building = build(m, function (result) {
                building = null;
                scene = result;
                layout(measure());
                render(reduce ? 0 : root.performance.now());
                hole.classList.add('is-ready');
            });
        }

        function onResize() {
            resizeStars();
            drawStars(0);
            if (!fgCanvas) {
                return;
            }
            var m = measure();
            if (scene) {
                var needed = geometry(m.boxWidth, m.dpr).R;
                if (needed > scene.geo.R * 1.35 || needed < scene.geo.R * 0.5) {
                    start();
                }
                layout(m);
                render(reduce ? 0 : root.performance.now());
            }
        }

        function frame(t) {
            if (!doc.hidden && heroVisible) {
                drawStars(t);
                render(t);
            }
            root.requestAnimationFrame(frame);
        }

        function applyParallax() {
            scrollTicking = false;
            if (!hole || !hero || reduce) {
                return;
            }
            var rect = hero.getBoundingClientRect();
            var view = root.innerHeight || 1;
            var progress = Math.min(1, Math.max(0, (view * 0.15 - rect.top) / (rect.height * 0.9)));
            var wide = root.matchMedia('(min-width: 900px)').matches;
            var shift = wide ? Math.min(48, root.scrollY * 0.08) : Math.min(16, root.scrollY * 0.04);
            heroVisible = rect.bottom > 0 && rect.top < view;
            hole.style.setProperty('--parallax', shift.toFixed(2) + 'px');
            hole.style.setProperty('--bh-opacity', (1 - progress * 0.85).toFixed(3));
        }

        function onScroll() {
            if (scrollTicking) {
                return;
            }
            scrollTicking = true;
            root.requestAnimationFrame(applyParallax);
        }

        function reveal() {
            var nodes = doc.querySelectorAll('.reveal');
            var i;
            if (reduce || !('IntersectionObserver' in root)) {
                for (i = 0; i < nodes.length; i++) {
                    nodes[i].classList.add('in');
                }
                return;
            }
            var io = new root.IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            for (i = 0; i < nodes.length; i++) {
                io.observe(nodes[i]);
            }
            root.setTimeout(function () {
                var pending = doc.querySelectorAll('.reveal:not(.in)');
                var n;
                for (n = 0; n < pending.length; n++) {
                    pending[n].classList.add('in');
                }
            }, 2800);
        }

        resizeStars();
        drawStars(0);
        reveal();
        if (hole && fgCanvas && bgCanvas && fgCanvas.getContext) {
            start();
        }
        root.addEventListener('resize', onResize);

        if (!reduce) {
            root.requestAnimationFrame(frame);
            root.addEventListener('scroll', onScroll, { passive: true });
            applyParallax();
        }
    }

    var api = {
        PALETTE: PALETTE,
        SHAPE: SHAPE,
        createNoise: createNoise,
        sweep: sweep,
        diskSample: diskSample,
        lensMask: lensMask,
        lensSample: lensSample,
        shadowSample: shadowSample,
        ringSample: ringSample,
        fillTexture: fillTexture,
        geometry: geometry,
        textureSizes: textureSizes,
        spinAt: spinAt
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.MissionScene = api;

    if (root.document && root.matchMedia) {
        boot();
    }
}(typeof window !== 'undefined' ? window : globalThis));
