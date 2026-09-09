import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { makeApifyClient, runGooglePlacesForRegion } from './lib/apify.mjs';
import { DATA, today, loadConfig } from './lib/paths.mjs';

// The only script that spends money. Everything downstream is free and
// re-runnable against whatever this leaves in data/.
async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const { file, config } = loadConfig(argv);
  console.log(`[find] config: ${file} (vertical: ${config._vertical})`);

  const outPath = path.join(DATA, `${config._outPrefix ?? 'raw'}-${today()}.json`);
  const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];
  const done = new Set(existing.map((p) => p._region).filter(Boolean));
  const regions = config.regions.filter((r) => !done.has(r));

  if (!regions.length) {
    console.log(`[find] every region already scraped today. Delete ${path.basename(outPath)} to re-scrape.`);
    return;
  }

  if (dryRun) {
    console.log('[find] DRY RUN — planned Apify runs:');
    regions.forEach((r) => console.log(`  - ${config.actor} / ${r} / ${config.searchStringsArray.join(', ')}`));
    const places = regions.length * config.searchStringsArray.length * config.maxCrawledPlacesPerSearch;
    const est = places * 0.004 + places * 0.001 + places * (config.maxImages ?? 0) * 0.0005;
    console.log(`[find] est. ${places} places max, ~$${est.toFixed(2)} on the FREE tier`);
    console.log(`[find] hard cap: $${config.maxTotalChargeUsd}`);
    return;
  }

  fs.mkdirSync(DATA, { recursive: true });
  const client = makeApifyClient(process.env.APIFY_TOKEN);
  const collected = [];

  for (const region of regions) {
    try {
      const items = await runGooglePlacesForRegion(client, { ...config, region });
      items.forEach((i) => { i._region = region; });
      collected.push(...items);
      // Save after every region so a budget cutoff never loses paid-for work.
      fs.writeFileSync(outPath, JSON.stringify([...existing, ...collected], null, 2));
      console.log(`[find] saved ${existing.length + collected.length} places`);
    } catch (e) {
      console.error(`[find] region=${region} failed: ${e.message}`);
      if (/limit|budget|quota/i.test(e.message)) {
        console.log('[find] looks like an Apify budget limit — stopping.');
        break;
      }
    }
  }

  console.log(`[find] done. ${existing.length + collected.length} places in data/${path.basename(outPath)}`);
  console.log('[find] next: npm run qualify');
}

main().catch((e) => { console.error(e); process.exit(1); });
