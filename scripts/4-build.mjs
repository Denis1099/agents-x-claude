import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { BRIEFS } from './lib/paths.mjs';
import { buildSiteDsl } from '../fallback/site-dsl.mjs';

/**
 * Builds the Framer site from a target brief.
 *
 * Reuses one pre-authorized project and wipes its page on each run. `project
 * new` opens a browser approval dialog every time — verified — which would put
 * a manual click in the middle of a live demo.
 *
 * Usage:
 *   node scripts/4-build.mjs <slug> [--publish] [--content path.json]
 */

const AGENT = ['--yes', '@framer/agent@latest'];
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'framer-'));

function agent(args, { input } = {}) {
  return execFileSync('npx', [...AGENT, ...args], {
    encoding: 'utf8',
    input,
    maxBuffer: 32 * 1024 * 1024,
  });
}

function execScript(sessionId, code) {
  const dir = tmp();
  const file = path.join(dir, 'run.js');
  fs.writeFileSync(file, code);
  try {
    return agent(['exec', '-s', sessionId, '-f', file]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Pulls the last JSON object printed by an exec call. */
function lastJson(out) {
  const start = out.lastIndexOf('{');
  if (start < 0) throw new Error(`no JSON in agent output:\n${out}`);
  return JSON.parse(out.slice(start));
}

function main() {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith('--'));
  const shouldPublish = argv.includes('--publish');
  const contentIdx = argv.indexOf('--content');
  const contentPath = contentIdx >= 0 ? argv[contentIdx + 1] : null;

  if (!slug) {
    console.error('usage: node scripts/4-build.mjs <slug> [--publish] [--content file.json]');
    process.exit(1);
  }

  const projectId = process.env.FRAMER_PROJECT_ID;
  if (!projectId) {
    console.error('[build] FRAMER_PROJECT_ID is missing from .env.');
    console.error('[build] Create and authorize one once with: npx @framer/agent@latest project new');
    process.exit(1);
  }

  const briefPath = path.join(BRIEFS, slug, 'brief.json');
  if (!fs.existsSync(briefPath)) {
    console.error(`[build] no brief at ${briefPath}. Run \`npm run qualify\` first.`);
    process.exit(1);
  }
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'));
  const content = contentPath ? JSON.parse(fs.readFileSync(contentPath, 'utf8')) : undefined;

  console.log(`[build] target: ${brief.name} (${brief.city})`);

  const sessionId = agent(['session', 'new', projectId]).trim().split('\n').pop().trim();
  console.log(`[build] session ${sessionId}`);

  // 1. Read the live page. Nothing about the project is hardcoded: the page and
  //    its primary breakpoint are discovered, so this runs against any project.
  //    getContext() returns a null site map, hence getNodesOfTypes.
  const probe = execScript(sessionId, `
const pages = await framer.agent.getNodesOfTypes({ types: ['WebPageNode'] });
const page = pages.find((p) => p.attributes && p.attributes.path === '/') || pages[0];
const full = await framer.agent.getNodes({ ids: [page.id] });
const node = full[0];
const existing = (node.children || []).flatMap((c) => c.children || []).map((c) => c.id);
// Styles are project-scoped, not page children, so a page wipe leaves them
// behind and a re-run would stack duplicate "Display" presets.
const styles = await framer.agent.getNodesOfTypes({ types: ['ColorStyleTokenNode', 'TextStylePresetNode'] });
console.log(JSON.stringify({
  breakpointId: node.$breakpoints[0].id,
  pagePath: (node.attributes && node.attributes.path) || '/',
  existing,
  staleStyles: (styles || []).map((s) => s.id),
}));
`);

  const info = lastJson(probe);
  console.log(
    `[build] breakpoint ${info.breakpointId} · wiping ${info.existing.length} sections, ${info.staleStyles.length} stale styles`,
  );

  const dsl = buildSiteDsl(brief, { breakpointId: info.breakpointId, content });
  const wipe = [...info.existing, ...info.staleStyles].map((id) => `DEL ${id};`).join('\n');
  const full = wipe ? `${wipe}\n${dsl}` : dsl;

  console.log(`[build] applying ${(full.match(/;/g) || []).length} commands…`);
  const applied = execScript(sessionId, `
const res = await framer.agent.applyChanges(${JSON.stringify(full)}, { pagePath: ${JSON.stringify(info.pagePath)} });
console.log(JSON.stringify({ diagnostics: res.diagnostics ?? null }));
`);
  const result = lastJson(applied);
  const warnings = result.diagnostics?.linter?.warnings ?? {};
  const warnCount = Object.keys(warnings).length;
  console.log(`[build] applied. ${warnCount} lint warning group(s).`);
  if (warnCount) console.log(JSON.stringify(warnings, null, 1).slice(0, 900));

  if (shouldPublish) {
    console.log('[build] publishing…');
    const pub = execScript(sessionId, `
const prev = await framer.agent.publish({ action: 'preview' });
if (prev.errors?.length) { console.log(JSON.stringify({ blocked: prev.errors })); }
else {
  const done = await framer.agent.publish({ action: 'confirm_publish', confirmationHash: prev.confirmationHash });
  console.log(JSON.stringify({ urls: done.urls ?? prev.urls, status: done.status }));
}
`);
    console.log(pub.trim().split('\n').pop());
  }

  console.log(`[build] done — ${brief.name}`);
}

main();
