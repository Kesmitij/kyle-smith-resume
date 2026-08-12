/**
 * Drives the shipped resume page and mission-scene implementation.
 * Run: node tests/resume.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'index.html');
const SCENE = path.join(ROOT, 'js', 'mission-scene.js');

let failed = 0;
let passed = 0;

function assert(cond, msg) {
    if (cond) {
        passed += 1;
        console.log('  PASS  ' + msg);
    } else {
        failed += 1;
        console.error('  FAIL  ' + msg);
    }
}

function createMockCtx() {
    const calls = [];
    function rec(name) {
        return function () {
            const args = Array.prototype.slice.call(arguments);
            calls.push({ name: name, args: args });
            if (name === 'createRadialGradient' || name === 'createLinearGradient') {
                return {
                    addColorStop: function (off, color) {
                        calls.push({ name: 'addColorStop', args: [off, color] });
                    }
                };
            }
            return undefined;
        };
    }
    return {
        calls: calls,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        shadowBlur: 0,
        shadowColor: '',
        lineCap: 'butt',
        fillRect: rec('fillRect'),
        clearRect: rec('clearRect'),
        beginPath: rec('beginPath'),
        arc: rec('arc'),
        ellipse: rec('ellipse'),
        fill: rec('fill'),
        stroke: rec('stroke'),
        save: rec('save'),
        restore: rec('restore'),
        translate: rec('translate'),
        rotate: rec('rotate'),
        scale: rec('scale'),
        moveTo: rec('moveTo'),
        lineTo: rec('lineTo'),
        closePath: rec('closePath'),
        createRadialGradient: rec('createRadialGradient'),
        createLinearGradient: rec('createLinearGradient')
    };
}

function hasCall(ctx, names) {
    return ctx.calls.some(function (c) { return names.indexOf(c.name) !== -1; });
}

console.log('== shipped page content ==');
const html = fs.readFileSync(PAGE, 'utf8');
const required = [
    'Kyle Smith',
    'Data Scientist',
    'AI Practitioner',
    'Citigroup',
    'Veterans Affairs',
    'USMD',
    'Walgreens',
    'United States Army',
    'github.com/Kesmitij',
    'kesmitij.github.io/kyle-smith-portfolio-2026',
    'Grok Build',
    'Medical Claims Analytics',
    'CDC Natality',
    'EPA AQS',
    'Tabular',
    'VAE'
];
required.forEach(function (s) {
    assert(html.indexOf(s) !== -1, 'page contains "' + s + '"');
});

assert(html.indexOf('id="nebula-canvas"') !== -1, 'nebula canvas present');
assert(html.indexOf('id="blackhole-canvas"') !== -1, 'blackhole canvas present');
assert(html.indexOf('id="starfield"') !== -1, 'starfield canvas present');
assert(html.indexOf('bh-horizon') !== -1, 'event horizon markup present');
assert(html.indexOf('bh-disk') !== -1, 'accretion disk markup present');
assert(html.indexOf('bh-photon-ring') !== -1, 'photon ring markup present');
assert(/bh-lens/.test(html), 'gravitational lens markup present');
assert(html.indexOf('js/mission-scene.js') !== -1, 'page loads shipped mission-scene.js');

console.log('== download control ==');
const hrefMatch = html.match(/class="download-resume"[^>]*href="([^"]+)"/i)
    || html.match(/href="([^"]+)"[^>]*class="download-resume"/i);
assert(!!hrefMatch, 'download-resume href found');
let resumePath = null;
let resumeSize = 0;
if (hrefMatch) {
    const href = hrefMatch[1];
    assert(!/^https?:/i.test(href), 'download href is a repo-relative file, not an external stub');
    resumePath = path.join(ROOT, href.replace(/^\.\//, ''));
    const exists = fs.existsSync(resumePath);
    assert(exists, 'download target exists: ' + href);
    if (exists) {
        resumeSize = fs.statSync(resumePath).size;
        assert(resumeSize > 1000, 'resume file is non-empty (' + resumeSize + ' bytes)');
        const ext = path.extname(resumePath).toLowerCase();
        assert(ext === '.docx' || ext === '.pdf', 'resume file is .docx or .pdf');
    }
}

console.log('== layout CSS is not 4px-box dominant ==');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
assert(!!styleMatch, 'inline stylesheet present');
if (styleMatch) {
    const css = styleMatch[1];
    const radii = [];
    const re = /border-radius\s*:\s*([^;]+);/gi;
    let m;
    while ((m = re.exec(css))) {
        radii.push(m[1].trim());
    }
    const four = radii.filter(function (r) { return r === '4px' || r === '2px'; });
    assert(four.length === 0, 'no 2px/4px border-radius values (' + four.length + ' of ' + radii.length + ')');
    assert(!/\.panel\s*\{[^}]*border-radius:\s*4px/.test(css), '.panel is not a 4px box');
    assert(!/\.metric-card\s*\{[^}]*border-radius:\s*4px/.test(css), '.metric-card is not a 4px box');
    assert(!/\.mission\s*\{[^}]*border-radius:\s*4px/.test(css), '.mission is not a 4px box');
    assert(!/\.skill-module\s*\{[^}]*border-radius:\s*4px/.test(css), '.skill-module is not a 4px box');
    assert(!/\.project-card\s*\{[^}]*border-radius:\s*4px/.test(css), '.project-card is not a 4px box');
    assert(/\.panel[\s\S]{0,180}border-radius:\s*0/.test(css), '.panel uses open (radius 0) surface');
}

console.log('== shipped mission-scene functions ==');
const scene = require(SCENE);
assert(typeof scene.blackHoleLayout === 'function', 'exports blackHoleLayout');
assert(typeof scene.describeBlackHoleScene === 'function', 'exports describeBlackHoleScene');
assert(typeof scene.drawEventHorizon === 'function', 'exports drawEventHorizon');
assert(typeof scene.drawAccretionDisk === 'function', 'exports drawAccretionDisk');
assert(typeof scene.drawPhotonRing === 'function', 'exports drawPhotonRing');
assert(typeof scene.drawGravitationalLens === 'function', 'exports drawGravitationalLens');
assert(typeof scene.drawStarField === 'function', 'exports drawStarField');
assert(typeof scene.drawNebulaField === 'function', 'exports drawNebulaField');

const layout = scene.blackHoleLayout(1920, 1080);
assert(layout.R > 0 && layout.cx > 0 && layout.cy > 0, 'layout has positive horizon geometry');
assert(layout.cx < 1920 && layout.cy < 1080, 'layout origin is inside the viewport');
assert(layout.hasEventHorizon && layout.hasAccretionDisk && layout.hasPhotonRing, 'layout flags horizon/disk/ring');
assert(layout.hasGravitationalLens && layout.hasStarField && layout.hasNebulaField, 'layout flags lens + cosmic field');

const desc = scene.describeBlackHoleScene(layout);
assert(desc.eventHorizon.r === layout.R, 'describe uses shipped horizon radius');
assert(desc.accretionDisk.outer > desc.accretionDisk.inner, 'disk outer > inner');
assert(desc.photonRing.r > desc.eventHorizon.r, 'photon ring sits outside the horizon');
assert(desc.gravitationalLens.width > 0, 'lens has width');
assert(desc.starField.present && desc.nebulaField.present, 'star/nebula field described');

const canvases = [{ width: 0, height: 0 }, { width: 1, height: 1 }];
const sized = scene.sizeCanvases(canvases, 1280, 720);
assert(sized.width === 1280 && sized.height === 720, 'sizeCanvases returns requested viewport');
assert(canvases[0].width === 1280 && canvases[0].height === 720, 'sizeCanvases writes first canvas');
assert(canvases[1].width === 1280 && canvases[1].height === 720, 'sizeCanvases writes second canvas');

const horizonCtx = createMockCtx();
scene.drawEventHorizon(horizonCtx, layout);
assert(hasCall(horizonCtx, ['arc', 'ellipse']), 'drawEventHorizon draws a circular horizon');
assert(hasCall(horizonCtx, ['fill']), 'drawEventHorizon fills the void');

const diskCtx = createMockCtx();
scene.drawAccretionDisk(diskCtx, layout, 1.25);
assert(hasCall(diskCtx, ['ellipse', 'arc']), 'drawAccretionDisk draws the tilted disk');

const ringCtx = createMockCtx();
scene.drawPhotonRing(ringCtx, layout, 0.5);
assert(hasCall(ringCtx, ['ellipse', 'arc']) && hasCall(ringCtx, ['stroke']), 'drawPhotonRing strokes the ring');

const lensCtx = createMockCtx();
scene.drawGravitationalLens(lensCtx, layout, 0.8);
assert(hasCall(lensCtx, ['createLinearGradient', 'createRadialGradient']), 'drawGravitationalLens uses a lens gradient');
assert(hasCall(lensCtx, ['fill', 'ellipse']), 'drawGravitationalLens paints lensed lobes');

const stars = scene.createStarField(800, 600);
assert(Array.isArray(stars) && stars.length > 50, 'createStarField yields a star field');
const starCtx = createMockCtx();
scene.drawStarField(starCtx, stars.slice(0, 20), 0.3);
assert(hasCall(starCtx, ['arc']), 'drawStarField paints stars');

const clouds = scene.createNebulaField(800, 600);
assert(Array.isArray(clouds) && clouds.length > 0, 'createNebulaField yields nebula clouds');
const nebCtx = createMockCtx();
scene.drawNebulaField(nebCtx, clouds, 0.2);
assert(hasCall(nebCtx, ['createRadialGradient']) && hasCall(nebCtx, ['ellipse']), 'drawNebulaField paints nebula');

const fullCtx = createMockCtx();
scene.drawCinematicBlackHole(fullCtx, layout, 2.2);
assert(hasCall(fullCtx, ['fillRect']), 'cinematic composer paints a halo field');
assert(fullCtx.calls.length > 20, 'cinematic composer issues a full draw sequence');

console.log('');
console.log('passed=' + passed + ' failed=' + failed);
if (resumePath) {
    console.log('resume=' + resumePath + ' bytes=' + resumeSize);
}
if (failed > 0) {
    process.exit(1);
}
