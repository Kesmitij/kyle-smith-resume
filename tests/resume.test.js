/**
 * Content and structure contract for the SpaceX-tailored resume site.
 * Run: node tests/resume.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'index.html');
const SCENE = path.join(ROOT, 'js', 'scene.js');
const PDF = path.join(ROOT, 'assets', 'Kyle_Smith_Resume_SpaceX.pdf');

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

function assertContains(html, needle, label) {
    assert(html.indexOf(needle) !== -1, label || ('contains ' + needle));
}

console.log('== syntax ==');
execFileSync(process.execPath, ['--check', SCENE], { stdio: 'pipe' });
execFileSync(process.execPath, ['--check', path.join(ROOT, 'tests', 'resume.test.js')], { stdio: 'pipe' });
assert(true, 'scene.js and tests parse');

console.log('== page source ==');
const html = fs.readFileSync(PAGE, 'utf8');
const scene = fs.readFileSync(SCENE, 'utf8');

const required = [
    'Kyle Smith',
    'AI / LLM Integration &amp; Mission Analytics',
    'Federal (VA) &amp; U.S. Army Veteran',
    'Murfreesboro, TN',
    'Open to relocation (Washington, DC)',
    '(727) 505-9500',
    'Kyle.e.smith1@outlook.com',
    'linkedin.com/in/kyle-edward-smith/',
    'https://www.linkedin.com/in/kyle-edward-smith/',
    'github.com/Kesmitij',
    'https://github.com/Kesmitij',
    'kesmitij.github.io/kyle-smith-portfolio-2026',
    'Mission-focused AI and data practitioner with 20+ years in analysis, operations, program management, and strategic planning, including 10+ years as a U.S. Army Military Police Program Manager / Training Developer and federal service with the U.S. Department of Veterans Affairs.',
    'Served as the VA facility\'s AI Governance Lead, establishing all AI processes and procedures and managing new AI products and services.',
    'Uses LLM tools and agents daily: set up a VA team with VS Code and GitHub Copilot agent workflows, is developing a custom AI agent, skills, and harness, and runs private LLM infrastructure for RAG and code-generation agents.',
    'Proven at turning stakeholder needs into delivered reports, applications, and automation, and at producing policies, training, budgets, and evaluations for government and military audiences.',
    'Former U.S. Secret clearance (U.S. Army, expired).',
    'Daily AI tools: Grok and Grok Bot (personal, exclusive), Claude (work)',
    'VS Code + GitHub Copilot agent / computer-use workflows',
    'custom AI agents / skills / harnesses',
    'local LLM deployment (Qwen2.5-Coder, llama.cpp quantization &amp; GPU offloading)',
    'RAG pipelines',
    'AI governance',
    'model test &amp; evaluation (19+ algorithm benchmarking)',
    'SHAP &amp; Permutation Importance explainability',
    'anomaly detection',
    'Autoencoders / VAEs',
    'XGBoost ensembles',
    'U.S. Army program management and training development (7 courses, 2,000+ Soldiers)',
    'accreditation compliance (108 standards)',
    'policy development',
    'production records and evaluations',
    'federal (VA) reporting for facility services and leadership',
    'Microsoft-centric secure (VA) environments',
    'field exercises',
    'Python (Pandas, scikit-learn, PyTorch, XGBoost)',
    'SQL Server (SSMS, stored procedures, Database Administration)',
    'Excel advanced analytics',
    'Headless Ubuntu Server Admin',
    'Systemd Services',
    'multi-GPU LLM deployment',
    'Power BI / Power Automate / Power Apps',
    'SSIS / SSRS',
    'SharePoint automation',
    'Grok Build (xAI) agentic development',
    'Program Analyst (Data Analyst)',
    'October 2026 – Present',
    'U.S. Department of Veterans Affairs',
    'Wrote and briefed a proposal that won executive approval for GitHub Enterprise and GitHub Copilot; set up the team with VS Code and GitHub Copilot, including agent-driven computer-use workflows, to expedite development and reduce workload.',
    'Developing a custom AI agent, reusable skills, and an agent harness aimed at automating Power BI and Power Apps development, the platforms used by the Nashville facility.',
    'Proposed a secure gateway enabling Power Apps to pull in local files and data within VA\'s resource-constrained, Microsoft-centric security requirements.',
    'Delivered 12 reports since October 2026 using SQL, Power BI, SSRS, and SSIS, with 4 additional reports currently in progress.',
    'Revamped a Power Apps application to track and maintain all accreditation requirements for the facility.',
    'Declined an IRS Data Scientist offer to return in a temporary transition role, supporting the former team through a staffing transition after all previous team members departed.',
    'Financial Reporting Sr. Analyst (Data Scientist)',
    'April 2025 – October 2026',
    'Citigroup',
    'Designed and deployed an ensemble unanimous-voting framework leveraging XGBoostClassifier, XGBRegressor, and XGBRFClassifier to detect anomalies in FR Y-14Q regulatory submissions — 99.31% classification accuracy and 100% error identification across multiple target variables.',
    'Implemented explainability pipelines integrating Permutation Importance and SHAP analysis, aggregating both into production-ready feature-importance artifacts for regulatory stakeholders.',
    'Architected an automated model test-and-evaluation pipeline that benchmarks datasets against 19 standardized algorithms, capturing full model artifacts, evaluation metrics, and optimal model selection per technique.',
    'Program Analyst (Data Analyst) / AI Governance Facility Lead',
    'October 2023 – September 2025',
    'Selected as the AI Governance Facility Lead. Established all processes and procedures related to AI within the facility, and managed new AI products and services introduced to the facility.',
    'Identified over $150,000 worth of duplicate Lab Testing over the previous FY by creating a report to reduce facility-wide expenses.',
    'Developed reports to assist services in automating redundant workload, saving approximately 4,000 hours of work. Developed 5 Employee Automation Tools for cost, personnel, and patient data management.',
    'Managed processes built within Power BI, Power Automate, Power Apps, SharePoint, SSIS, SSMS, SSRS, Palantir, and Pyramid Analytics for the facility.',
    'July 2022 – October 2023',
    'USMD',
    'Identified a 7-year accounting report error which resulted in the underpayment of employee bonuses by over $4 million during that time.',
    'Spearheaded the transition of reporting systems encompassing over 400 reports from QlikView to SSRS. Rewrote 127 reports and the primary report dataset with over 1.7 billion data points used for over 200 reports.',
    'Self-taught SSRS in both Visual Studio and SSRS Report Builder to support the report transition project. Reduced daily run time on the largest QlikView procedure from over 3 hours to a 7-minute stored procedure when migrated to SSRS (2,571% savings in processing time).',
    'Workforce Management Technology Analyst',
    'July 2018 – July 2022',
    'Walgreens',
    'Responsible for Database Administration for 4,000+ active employees and over 10,000+ terminated employee profiles across three separate systems (Genesys, Genesys Workforce Management, Employee Management System) — totaling 566,000+ data values.',
    'Extracted multiple data sets from various servers to compile reports for Operational and Administration leaders utilizing SQL Server Management Studio, Power BI, and Excel among other sources.',
    'Developed Power Automate processes for Agent Configurations, Agent Termination, and New Hire processes, automating approximately 15 hours of workload a week.',
    'Program Manager / Training Developer (Staff Sergeant)',
    'August 2007 – May 2018',
    'United States Army, Military Police Corps',
    'Program Manager / Training Developer for 7 courses and the Credentialing Program, supporting 2,000+ Military Police Soldiers.',
    'Achieved 100% accreditation compliance managing 108 standards.',
    'Developed policies and expanded the Credentialing Program to all six Army Correctional Facilities; prepared budgets, production records, and evaluations.',
    'Served as a Military Police Platoon Sergeant; planned and led field exercises.',
    'Worked on military installations throughout 10+ years of service, handling Secret and unclassified information under a Secret clearance (now expired).',
    'Personal Projects (Independent Work)',
    'The following are personal projects developed independently; they are not employer-assigned work.',
    'Multi-Agent AI Operations (Grok Bot)',
    'Direct a team of ~10 Grok Bot AI agents through a lead orchestrator agent that routes work to specialist agents (video director, music-video maker, Shorts maker, compilation editor, thumbnail designer, YouTube uploader/scheduler), with a chief-of-staff agent coordinating the others.',
    'Agents run a kids\' YouTube channel (Koco\'s Corner): songs, animated music videos, Shorts, weekly episodes, thumbnails, uploads on a fixed weekly posting calendar, and a weekend 24/7-style livestream moved to stream from a personal laptop via ffmpeg.',
    'Wrote standing rules, playbooks, and reusable skills that govern agent behavior; scripted repetitive steps to cut usage costs and set up scheduled routines for recurring work. Also use the agents with connected financial accounts to help manage personal finances, with owner approval required before financial actions.',
    'Medical Claims Analytics — Power BI + Grok Build (Featured)',
    'medical-claims-analytics-grok-build · July 2026',
    'Production-oriented medical claims Power BI Desktop report authored with Grok Build (xAI): install Desktop, bind local anonymized claims data, clinical healthcare theme, multi-visual Claims Overview layout, automated verification, and public GitHub Pages case study.',
    'Headless Multi-GPU LLM Inference Server &amp; Local Agent Infrastructure',
    'Repurposed a crypto mining rig (3× NVIDIA RTX 3060 + GTX 1660 Super) with only 8 GB system RAM into a production-grade headless Ubuntu Server LTS environment for private LLM deployment.',
    'Deployed and optimized Qwen2.5-Coder-7B-Instruct using llama.cpp with 4/5-bit quantization, KV-cache management, and intelligent GPU offloading despite severe memory constraints. Configured Systemd services, SSH hardening, ufw firewall, and basic monitoring for reliable always-on operation.',
    'Leverages the infrastructure for private RAG pipelines, code-generation agents, and rapid experimentation with model quantization, pruning, and multi-GPU load balancing — enabling secure, cost-free local AI development and practical MLOps skills.',
    'Advanced ML Architectures, Explainability &amp; Benchmarking Prototypes',
    'Built production-oriented explainability pipelines combining SHAP values, permutation importance, and custom data-type reconciliation layers to produce stakeholder-ready feature importance artifacts and model cards.',
    'Developed automated benchmarking harnesses evaluating 19+ algorithms (tree-based, linear, neural, ensemble) with full artifact capture, hyperparameter tracking, metrics aggregation, and optimal model selection — transferable to regulatory and governance use cases. Extended research into self-attention, structured pruning for edge deployment, and lightweight RAG on consumer-grade hardware.',
    'Master of Business Administration (MBA)',
    '3.65 GPA',
    'Keller Graduate School of Management',
    'December 2021',
    'Graduate Certificate in Business Intelligence and Analytics Management',
    '3.6 GPA',
    'November 2021',
    'B.S. in Technical Management (Project Management)',
    'Magna Cum Laude, 3.7 GPA',
    'DeVry University',
    'December 2020'
];

required.forEach(function (needle) {
    assertContains(html, needle);
});

console.log('== stale content is gone ==');
const forbidden = [
    'Kissimmee',
    'CDC Natality',
    'EPA AQS',
    'Candidate Mission Dossier',
    'Systems Nominal',
    'Orbitron',
    'Kyle_Smith_Resume.docx',
    'Kyle_Smith_Resume.pdf"',
    'href="Kyle_Smith_Resume.pdf"',
    'developed independently and published on GitHub',
    'binary-classification benchmarking',
    'multi-target Autoencoder architectures',
    '28.29',
    'Data Scientist &amp; AI Practitioner',
    'Data Scientist & AI Practitioner'
];
forbidden.forEach(function (needle) {
    assert(html.indexOf(needle) === -1, 'page omits stale "' + needle + '"');
});
assert(!fs.existsSync(path.join(ROOT, 'Kyle_Smith_Resume.pdf')), 'old root PDF is not shipped');
assert(!fs.existsSync(path.join(ROOT, 'Kyle_Smith_Resume.docx')), 'old root DOCX is not shipped');

console.log('== download ==');
const hrefs = [];
const hrefRe = /href="([^"]+)"/g;
let hrefMatch;
while ((hrefMatch = hrefRe.exec(html))) {
    hrefs.push(hrefMatch[1]);
}
const pdfHrefs = hrefs.filter(function (h) { return h.indexOf('Kyle_Smith_Resume_SpaceX.pdf') !== -1; });
assert(pdfHrefs.length >= 1, 'at least one PDF resume link');
pdfHrefs.forEach(function (h) {
    assert(h === 'assets/Kyle_Smith_Resume_SpaceX.pdf', 'PDF href is the repo asset (' + h + ')');
});
assert(html.indexOf('Download PDF') !== -1, 'visible Download PDF control');
assert(fs.existsSync(PDF), 'PDF asset exists');
const pdfBuf = fs.readFileSync(PDF);
assert(pdfBuf.slice(0, 5).toString() === '%PDF-', 'asset is a PDF');
assert(pdfBuf.length > 1000, 'PDF is non-empty (' + pdfBuf.length + ' bytes)');

console.log('== document outline and meta ==');
assert(/<html[^>]*lang="en"/.test(html), 'html lang is en');
assert(/<title>[^<]*Kyle Smith[^<]*<\/title>/.test(html), 'title names Kyle Smith');
assert(html.indexOf('name="description"') !== -1, 'meta description present');
assert(html.indexOf('name="viewport"') !== -1, 'viewport meta present');
assert(html.indexOf('property="og:title"') !== -1, 'og:title present');
assert(html.indexOf('property="og:description"') !== -1, 'og:description present');
assert(html.indexOf('property="og:type"') !== -1, 'og:type present');
assert(html.indexOf('content="https://kesmitij.github.io/kyle-smith-resume/"') !== -1, 'canonical Pages URL present');
assert(/<main[\s>]/.test(html), 'main landmark');
assert(/<nav[\s>]/.test(html), 'nav landmark');
assert(/<h1[\s>]/.test(html), 'h1 present');
assert(html.indexOf('id="summary"') !== -1, 'summary section');
assert(html.indexOf('id="experience"') !== -1, 'experience section');
assert(html.indexOf('id="projects"') !== -1, 'projects section');
assert(html.indexOf('id="skills"') !== -1, 'skills section');
assert(html.indexOf('id="education"') !== -1, 'education section');
assert(/<h2[\s>]/.test(html), 'section headings');
assert(html.indexOf('aria-label="Primary"') !== -1, 'primary nav label');
assert(html.indexOf('class="skip"') !== -1, 'skip link');

console.log('== visual system ==');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
assert(!!styleMatch, 'inline stylesheet present');
if (styleMatch) {
    const css = styleMatch[1];
    assert(/-apple-system/.test(css), 'system font stack leads with -apple-system');
    assert(/SF Pro Display/.test(css), 'SF Pro Display is in the stack');
    assert(/SF Pro Text/.test(css), 'SF Pro Text is in the stack');
    assert(/\bInter\b/.test(css), 'Inter is the named fallback');
    assert(/backdrop-filter\s*:/.test(css), 'frosted glass backdrop-filter');
    assert(/position:\s*sticky/.test(css), 'sticky nav');
    assert(/prefers-reduced-motion/.test(css), 'reduced motion is respected');
    assert(/:focus-visible/.test(css), 'keyboard focus styles');
    const radii = [];
    const re = /border-radius\s*:\s*([^;]+);/gi;
    let m;
    while ((m = re.exec(css))) {
        radii.push(m[1].trim());
    }
    const tiny = radii.filter(function (r) { return r === '4px' || r === '2px'; });
    assert(tiny.length === 0, 'no 2px/4px box radii');
}

console.log('== black hole artwork ==');
assert(html.indexOf('id="blackhole"') !== -1, 'black hole root');
assert(html.indexOf('id="bh-canvas"') !== -1, 'black hole canvas');
assert(html.indexOf('id="starfield"') !== -1, 'starfield canvas');
assert(html.indexOf('aria-hidden="true"') !== -1, 'decorative artwork hidden from assistive tech');
assert(html.indexOf('js/scene.js') !== -1, 'scene script referenced');
assert(scene.indexOf('prefers-reduced-motion') !== -1, 'scene honors reduced motion');
assert(scene.indexOf('starfield') !== -1, 'scene drives the starfield');
assert(scene.indexOf('blackhole') !== -1, 'scene parallaxes the black hole');

const sceneApi = require(SCENE);
assert(typeof sceneApi.drawEventHorizon === 'function', 'exports drawEventHorizon');
assert(typeof sceneApi.drawAccretionDisk === 'function', 'exports drawAccretionDisk');
assert(typeof sceneApi.drawPhotonRing === 'function', 'exports drawPhotonRing');
assert(typeof sceneApi.drawGravitationalLens === 'function', 'exports drawGravitationalLens');
assert(typeof sceneApi.drawBlackHole === 'function', 'exports drawBlackHole');

function mockCtx() {
    const calls = [];
    function rec(name) {
        return function () {
            calls.push(name);
            if (name === 'createRadialGradient') {
                return { addColorStop: function () { calls.push('addColorStop'); } };
            }
            return undefined;
        };
    }
    return {
        calls: calls,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        lineCap: 'butt',
        shadowBlur: 0,
        shadowColor: '',
        globalCompositeOperation: 'source-over',
        clearRect: rec('clearRect'),
        fillRect: rec('fillRect'),
        beginPath: rec('beginPath'),
        arc: rec('arc'),
        ellipse: rec('ellipse'),
        fill: rec('fill'),
        stroke: rec('stroke'),
        save: rec('save'),
        restore: rec('restore'),
        translate: rec('translate'),
        scale: rec('scale'),
        moveTo: rec('moveTo'),
        lineTo: rec('lineTo'),
        closePath: rec('closePath'),
        createRadialGradient: rec('createRadialGradient')
    };
}
function saw(ctx, name) {
    return ctx.calls.indexOf(name) !== -1;
}

const horizon = mockCtx();
sceneApi.drawEventHorizon(horizon, 0, 0, 96);
assert(saw(horizon, 'arc') && saw(horizon, 'fill'), 'horizon paints a filled void');

const disk = mockCtx();
sceneApi.drawAccretionDisk(disk, 0.6, 'near');
assert(saw(disk, 'moveTo') && saw(disk, 'lineTo') && saw(disk, 'fill'), 'disk paints an accretion sweep');

const ring = mockCtx();
sceneApi.drawPhotonRing(ring, 0, 0, 102);
assert(saw(ring, 'arc') && saw(ring, 'stroke'), 'photon ring is stroked');

const lens = mockCtx();
sceneApi.drawGravitationalLens(lens, 0, 0);
assert(saw(lens, 'createRadialGradient') && saw(lens, 'ellipse'), 'lensing glow uses a gradient and arcs');

const full = mockCtx();
sceneApi.drawBlackHole(full, 560, 560, 1800);
assert(saw(full, 'clearRect') && full.calls.length > 40, 'full scene composes the hole');

console.log('');
console.log('passed=' + passed + ' failed=' + failed);
if (failed > 0) {
    process.exit(1);
}
