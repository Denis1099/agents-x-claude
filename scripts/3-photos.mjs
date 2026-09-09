import fs from 'node:fs';
import path from 'node:path';
import { BRIEFS } from './lib/paths.mjs';

// Framer's on-canvas Agent accepts image attachments, so the demo site can be
// built from the business's own Google photos rather than stock imagery.
// That is the difference between a mockup and something they recognize.
async function downloadBrief(slug) {
  const dir = path.join(BRIEFS, slug);
  const brief = JSON.parse(fs.readFileSync(path.join(dir, 'brief.json'), 'utf8'));
  if (!brief.photos.length) {
    console.log(`[photos] ${slug}: no photos on the listing, skipping`);
    return 0;
  }

  fs.mkdirSync(path.join(dir, 'photos'), { recursive: true });
  let ok = 0;
  for (const photo of brief.photos) {
    const dest = path.join(dir, photo.localPath);
    if (fs.existsSync(dest)) { ok++; continue; }
    try {
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (e) {
      console.warn(`[photos] ${slug}/${photo.localPath} failed: ${e.message}`);
    }
  }
  console.log(`[photos] ${slug}: ${ok}/${brief.photos.length} downloaded`);
  return ok;
}

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!fs.existsSync(BRIEFS)) {
    console.error('[photos] no briefs yet. Run `npm run qualify` first.');
    process.exit(1);
  }
  const slugs = only ? [only] : fs.readdirSync(BRIEFS).filter((s) => !s.startsWith('.'));
  for (const slug of slugs) await downloadBrief(slug);
  console.log('[photos] done. Attach these to the Framer Agent prompts.');
}

main().catch((e) => { console.error(e); process.exit(1); });
