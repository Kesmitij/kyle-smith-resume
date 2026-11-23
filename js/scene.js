/**
 * Original event-horizon artwork and a sparse starfield.
 * The hole is a dark circular shadow, a thin photon ring, an inclined
 * accretion disk with a slow brightness sweep, and a soft lensing glow.
 * It is not a logo.
 */
(function (root) {
    'use strict';

    var INNER = 108;
    var OUTER = 228;
    var FLATTEN = 0.5;
    var HORIZON = 96;

    function drawGravitationalLens(ctx, cx, cy) {
        var glow = ctx.createRadialGradient(cx, cy - 8, 30, cx, cy, 250);
        glow.addColorStop(0, 'rgba(126, 176, 255, 0.20)');
        glow.addColorStop(0.42, 'rgba(126, 176, 255, 0.06)');
        glow.addColorStop(1, 'rgba(126, 176, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 250, 168, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.shadowColor = 'rgba(210, 226, 255, 0.85)';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = 'rgba(236, 244, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 6, 168, 86, 0, Math.PI * 1.16, Math.PI * 1.84);
        ctx.stroke();
        ctx.lineWidth = 1.7;
        ctx.strokeStyle = 'rgba(150, 190, 255, 0.32)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 188, 96, 0, Math.PI * 0.14, Math.PI * 0.86);
        ctx.stroke();
        ctx.restore();
    }

    function diskPoint(theta, radius) {
        return {
            x: Math.cos(theta) * radius,
            y: Math.sin(theta) * radius * FLATTEN
        };
    }

    function drawAccretionDisk(ctx, rot, side) {
        var steps = 360;
        var dTheta = (Math.PI * 2) / steps;
        var i;
        var theta;
        var mid;
        var s;
        var hot;
        var alpha;
        var a;
        var b;
        var c;
        var d;
        ctx.save();
        ctx.filter = 'blur(2px)';
        for (i = 0; i < steps; i++) {
            theta = rot + i * dTheta;
            mid = theta + dTheta * 0.5;
            s = Math.sin(mid);
            if (side === 'far' && s > 0.12) {
                continue;
            }
            if (side === 'near' && s < -0.02) {
                continue;
            }
            hot = Math.pow(Math.max(0, Math.cos(mid - rot - 0.85)), 4);
            alpha = 0.18 + hot * 0.78;
            a = diskPoint(theta, INNER);
            b = diskPoint(theta, OUTER);
            c = diskPoint(theta + dTheta, OUTER);
            d = diskPoint(theta + dTheta, INNER);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.lineTo(c.x, c.y);
            ctx.lineTo(d.x, d.y);
            ctx.closePath();
            ctx.fillStyle = hot > 0.45
                ? 'rgba(255, 255, 255, ' + alpha + ')'
                : 'rgba(164, 198, 255, ' + alpha + ')';
            ctx.fill();
        }
        var hotTheta = rot + 0.85;
        var hotSin = Math.sin(hotTheta);
        var showBloom = (side === 'near' && hotSin >= -0.02) || (side === 'far' && hotSin < 0.12 && hotSin < 0);
        if (showBloom) {
            var hp = diskPoint(hotTheta, (INNER + OUTER) * 0.5);
            var bloom = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 86);
            bloom.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
            bloom.addColorStop(0.4, 'rgba(186, 214, 255, 0.16)');
            bloom.addColorStop(1, 'rgba(186, 214, 255, 0)');
            ctx.fillStyle = bloom;
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 86, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawEventHorizon(ctx, cx, cy, r) {
        var shade = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
        shade.addColorStop(0, '#000000');
        shade.addColorStop(0.86, '#000000');
        shade.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPhotonRing(ctx, cx, cy, r) {
        ctx.save();
        ctx.shadowColor = 'rgba(186, 214, 255, 0.95)';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(244, 248, 255, 0.95)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(150, 190, 255, 0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawBlackHole(ctx, w, h, time) {
        var cx = w / 2;
        var cy = h / 2;
        var scale = Math.min(w, h) / 560;
        var rot = (time || 0) * 0.00013;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        drawGravitationalLens(ctx, 0, 0);
        drawAccretionDisk(ctx, rot, 'far');
        drawEventHorizon(ctx, 0, 0, HORIZON);
        drawPhotonRing(ctx, 0, 0, HORIZON + 6);
        drawAccretionDisk(ctx, rot, 'near');
        ctx.restore();
    }

    function boot() {
        var canvas = document.getElementById('starfield');
        var hole = document.getElementById('blackhole');
        var holeCanvas = document.getElementById('bh-canvas');
        var hero = document.getElementById('top');
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var stars = [];
        var width = 0;
        var height = 0;
        var dpr = 1;
        var running = false;
        var scrollTicking = false;
        var heroVisible = true;
        var holeCtx = holeCanvas && holeCanvas.getContext ? holeCanvas.getContext('2d') : null;

        function rand(a, b) {
            return a + Math.random() * (b - a);
        }

        function makeStars() {
            var count = Math.max(70, Math.min(160, Math.floor(width * height / 14000)));
            var i;
            var roll;
            stars = [];
            for (i = 0; i < count; i++) {
                roll = Math.random();
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: roll > 0.94 ? rand(1.1, 1.7) : rand(0.3, 0.9),
                    a: rand(0.15, 0.55),
                    phase: Math.random() * Math.PI * 2,
                    cool: roll > 0.82
                });
            }
        }

        function resizeStarfield() {
            if (!canvas) {
                return;
            }
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            makeStars();
        }

        function drawStars(t) {
            if (!canvas || !canvas.getContext) {
                return;
            }
            var ctx = canvas.getContext('2d');
            var i;
            var s;
            var alpha;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);
            for (i = 0; i < stars.length; i++) {
                s = stars[i];
                alpha = s.a;
                if (!reduce) {
                    alpha *= 0.72 + 0.28 * Math.sin(t * 0.001 + s.phase);
                }
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.fillStyle = s.cool ? '#c5d8ff' : '#f5f7fb';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        function resizeHole() {
            if (!holeCanvas || !hole) {
                return;
            }
            var rect = hole.getBoundingClientRect();
            var ratio = Math.min(window.devicePixelRatio || 1, 2);
            var w = Math.max(1, Math.floor(rect.width));
            var h = Math.max(1, Math.floor(rect.height));
            holeCanvas.width = Math.floor(w * ratio);
            holeCanvas.height = Math.floor(h * ratio);
            holeCanvas.style.width = w + 'px';
            holeCanvas.style.height = h + 'px';
            if (holeCtx) {
                holeCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
                drawBlackHole(holeCtx, w, h, reduce ? 1400 : performance.now());
            }
        }

        function frame(t) {
            if (!running) {
                return;
            }
            if (!document.hidden && heroVisible) {
                drawStars(t);
                if (holeCtx && holeCanvas) {
                    var rect = hole.getBoundingClientRect();
                    drawBlackHole(holeCtx, rect.width, rect.height, t);
                }
            }
            window.requestAnimationFrame(frame);
        }

        function applyParallax() {
            scrollTicking = false;
            if (!hole || !hero || reduce) {
                return;
            }
            var rect = hero.getBoundingClientRect();
            var view = window.innerHeight || 1;
            var progress = Math.min(1, Math.max(0, (view * 0.15 - rect.top) / (rect.height * 0.9)));
            var wide = window.matchMedia('(min-width: 900px)').matches;
            var shift = wide ? Math.min(48, window.scrollY * 0.08) : Math.min(16, window.scrollY * 0.04);
            heroVisible = rect.bottom > 0 && rect.top < view;
            hole.style.setProperty('--parallax', shift.toFixed(2) + 'px');
            hole.style.setProperty('--bh-opacity', (1 - progress * 0.85).toFixed(3));
        }

        function onScroll() {
            if (scrollTicking) {
                return;
            }
            scrollTicking = true;
            window.requestAnimationFrame(applyParallax);
        }

        function reveal() {
            var nodes = document.querySelectorAll('.reveal');
            var i;
            if (reduce || !('IntersectionObserver' in window)) {
                for (i = 0; i < nodes.length; i++) {
                    nodes[i].classList.add('in');
                }
                return;
            }
            var io = new IntersectionObserver(function (entries) {
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
            window.setTimeout(function () {
                var pending = document.querySelectorAll('.reveal:not(.in)');
                var n;
                for (n = 0; n < pending.length; n++) {
                    pending[n].classList.add('in');
                }
            }, 2800);
        }

        resizeStarfield();
        resizeHole();
        drawStars(0);
        reveal();
        window.addEventListener('resize', function () {
            resizeStarfield();
            resizeHole();
            drawStars(0);
        });

        if (!reduce) {
            running = true;
            window.requestAnimationFrame(frame);
            window.addEventListener('scroll', onScroll, { passive: true });
            applyParallax();
        }
    }

    var api = {
        drawEventHorizon: drawEventHorizon,
        drawAccretionDisk: drawAccretionDisk,
        drawPhotonRing: drawPhotonRing,
        drawGravitationalLens: drawGravitationalLens,
        drawBlackHole: drawBlackHole
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.MissionScene = api;

    if (typeof document !== 'undefined') {
        boot();
    }
}(typeof window !== 'undefined' ? window : this));
