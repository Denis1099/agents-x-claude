/**
 * National franchises and lead-gen brands, dropped by business name.
 *
 * This is the metro tax. Scraping San Antonio instead of a small town buys a
 * far bigger pool, but it also drags in franchises that clear every quality
 * gate while being useless targets: they already have corporate sites, and no
 * franchisee is buying one. The same problem shows up in every vertical, and
 * a name blocklist is the cheapest reliable fix.
 *
 * Keep this a blocklist, never an allowlist — an unrecognized name should
 * always survive to the ranked list, where a human sees it.
 */
export const CHAINS = [
  // Lawn care and landscaping franchises
  /tru\s*green/i,
  /weed\s*man/i,
  /lawn\s*doctor/i,
  /\bu\.?\s*s\.?\s*lawns\b/i,
  /lawn\s*starter/i,
  /lawn\s*love/i,
  /bright\s*view/i,
  /grounds\s*guys/i,
  /yellowstone\s*landscape/i,
  /natura\s*lawn/i,
  /spring[\s-]*green/i,
  /scotts?\s*lawn/i,
  /\bchem\s*lawn\b/i,
  // Tree services
  /bartlett\s*tree/i,
  /\bdavey\b/i,
  /monster\s*tree/i,
  // Pest control, which Google files under lawn care often enough to matter
  /mosquito\s*joe/i,
  /\bterminix\b/i,
  /\borkin\b/i,
  /\btruly\s*nolen\b/i,
];

/**
 * @param {string|null|undefined} name - the business title
 * @returns {boolean}
 */
export function isChain(name) {
  if (typeof name !== 'string' || !name) return false;
  return CHAINS.some((re) => re.test(name));
}
