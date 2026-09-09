import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = path.join(ROOT, 'data');
export const BRIEFS = path.join(DATA, 'briefs');

export function today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** Newest data/raw-*.json, so the free steps always act on the last scrape. */
export function newestRawFile(prefix = 'raw') {
  if (!fs.existsSync(DATA)) return null;
  const files = fs.readdirSync(DATA)
    .filter((f) => new RegExp(`^${prefix}-\\d+\\.json$`).test(f))
    .sort()
    .reverse();
  return files.length ? path.join(DATA, files[0]) : null;
}

export function loadConfig(argv) {
  const i = argv.indexOf('--config');
  const file = i >= 0 ? argv[i + 1] : 'config/landscaping-sa.json';
  return { file, config: JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')) };
}
