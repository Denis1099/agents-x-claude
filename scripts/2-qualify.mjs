import fs from 'node:fs';
import path from 'node:path';
import { qualify } from './lib/qualify.mjs';
import { buildBrief, briefToMarkdown } from './lib/brief.mjs';
import { DATA, BRIEFS, today, newestRawFile, loadConfig } from './lib/paths.mjs';

// Free and re-runnable. Tune the gates and run this as many times as you like. Function main() {
  const argv = process.argv.slice(2);
  const { config } = loadConfig(argv);

  const rawPath = newestRawFile();
  if (!rawPath) {
    console.error('[qualify] no data/raw-*.json found. Run `npm run find` first.');
    process.exit(1);
  }
  const places = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`[qualify] ${places.length} places from ${path.basename(rawPath)}`);

  const { targets, rejected } = qualify(places, {
    minRating: config.minRating,
    minReviews: config.minReviews,
    allowTiers: config.allowTiers,
  });

  const tally = rejected.reduce((acc, r) => ({ ...acc, [r.reason]: (acc[r.reason] || 0) + 1 }), {});
  console.log(`[qualify] rejected ${rejected.length}:`, tally);
  console.log(`[qualify] ${targets.length} qualified targets`);

  if (!targets.length) {
    console.error('[qualify] nothing qualified. Loosen minReviews in the config and re-run. This step is free.');
    process.exit(1);
  }

  const targetsPath = path.join(DATA, `targets-${today()}.json`);
  fs.writeFileSync(targetsPath, JSON.stringify(
    targets.map((t) => ({ title: t.place.title, tier: t.tier, score: Math.round(t.score * 100) / 100 })),
    null, 2,
  ));

  const n = config.briefsToWrite ?? 5;
  for (const target of targets.slice(0, n)) {
    const brief = buildBrief(target);
    const dir = path.join(BRIEFS, brief.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'brief.json'), JSON.stringify(brief, null, 2));
    fs.writeFileSync(path.join(dir, 'brief.md'), briefToMarkdown(brief));
  }

  console.log(`\n[qualify] top ${Math.min(n, targets.length)} targets:`);
  targets.slice(0, n).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.place.title}. Score ${Math.round(t.score)} (${t.tier}, ${t.place.totalScore}★ / ${t.place.reviewsCount} reviews)`);
  });

  const best = buildBrief(targets[0]);
  console.log(`\n[qualify] DEMO TARGET: ${best.name}`);
  console.log(`           ${best.whyQualified}`);
  console.log(`           data/briefs/${best.slug}/brief.md`);
  console.log('[qualify] next: npm run photos');
}

main();
