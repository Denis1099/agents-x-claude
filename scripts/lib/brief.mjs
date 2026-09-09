import { photoCount } from './qualify.mjs';
import { websiteHost } from './website-tier.mjs';

const MAX_PHOTOS = 12;

export function slugify(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The actor returns tag arrays as either strings or {title,count} objects. */
function normalizeTags(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => (typeof t === 'string'
      ? { tag: t, count: null }
      : { tag: t?.title ?? t?.tag ?? null, count: Number.isFinite(t?.count) ? t.count : null }))
    .filter((t) => t.tag);
}

function serviceTagsFor(place) {
  const fromCategories = Array.isArray(place?.categories) ? place.categories : [];
  const single = place?.categoryName ? [place.categoryName] : [];
  const fromPlaces = normalizeTags(place?.placesTags).map((t) => t.tag);
  return [...new Set([...single, ...fromCategories, ...fromPlaces])];
}

/**
 * Number(null) is 0 and Number('') is 0, so a bare Number() coercion turns a
 * missing rating into a confident "0★" on the brief. Reject the empties first.
 */
function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * The one sentence Denis reads aloud on the call. It has to survive being
 * said out loud, so it names real numbers and nothing else.
 */
function whyQualified(place, tier) {
  const rating = num(place?.totalScore);
  const reviews = num(place?.reviewsCount);
  const photos = photoCount(place);

  const parts = [];
  if (rating !== null) parts.push(`${rating}★`);
  if (reviews !== null) parts.push(`from ${reviews} reviews`);
  if (photos) parts.push(`and ${photos} photos`);
  const proof = parts.length ? `${parts.join(' ')} on Google` : 'Listed on Google';

  if (tier === 'social_only') {
    const host = websiteHost(place);
    return `${proof} — and no real website, just ${host}.`;
  }
  return `${proof} — and no website on the listing at all.`;
}

/**
 * The interface between the FINDER and the BUILDER. Everything the Framer
 * prompt pack needs, and nothing the site could not honestly claim.
 *
 * @param {{place: object, tier: string, score: number}} target
 */
export function buildBrief({ place, tier, score }) {
  const photoUrls = (Array.isArray(place?.imageUrls) ? place.imageUrls : []).slice(0, MAX_PHOTOS);

  return {
    slug: slugify(place?.title),
    name: place?.title ?? null,
    category: place?.categoryName ?? null,
    categories: Array.isArray(place?.categories) ? place.categories : [],
    city: place?.city ?? null,
    state: place?.state ?? null,
    address: place?.address ?? null,
    neighborhood: place?.neighborhood ?? null,
    phone: place?.phone ?? place?.phoneUnformatted ?? null,
    rating: num(place?.totalScore),
    reviewCount: num(place?.reviewsCount),
    hours: Array.isArray(place?.openingHours) ? place.openingHours : [],
    serviceTags: serviceTagsFor(place),
    reviewThemes: normalizeTags(place?.reviewsTags),
    photos: photoUrls.map((url, i) => ({
      url,
      localPath: `photos/${String(i + 1).padStart(2, '0')}.jpg`,
    })),
    mapsUrl: place?.url ?? null,
    placeId: place?.placeId ?? null,
    websiteTier: tier,
    websiteRaw: place?.website ?? null,
    whyQualified: whyQualified(place, tier),
    score: Math.round(score * 100) / 100,
    scrapedAt: place?.scrapedAt ?? new Date().toISOString(),
  };
}

export function briefToMarkdown(brief) {
  const line = (label, value) => (value ? `- **${label}:** ${value}\n` : '');
  const location = [brief.neighborhood, brief.city, brief.state].filter(Boolean).join(', ');

  let md = `# ${brief.name}\n\n`;
  md += `> ${brief.whyQualified}\n\n`;
  md += `## Listing\n\n`;
  md += line('Category', brief.category);
  md += line('Location', location);
  md += line('Address', brief.address);
  md += line('Phone', brief.phone);
  md += line('Rating', brief.rating !== null ? `${brief.rating}★ (${brief.reviewCount ?? 0} reviews)` : null);
  md += line('Website tier', brief.websiteTier);
  md += line('Existing link', brief.websiteRaw);
  md += line('Google Maps', brief.mapsUrl);

  if (brief.serviceTags.length) {
    md += `\n## Services Google associates with them\n\n`;
    md += brief.serviceTags.map((t) => `- ${t}`).join('\n') + '\n';
  }
  if (brief.hours.length) {
    md += `\n## Hours\n\n`;
    md += brief.hours.map((h) => `- ${h.day}: ${h.hours}`).join('\n') + '\n';
  }
  if (brief.reviewThemes.length) {
    md += `\n## What reviewers keep mentioning\n\n`;
    md += brief.reviewThemes
      .map((t) => `- ${t.tag}${t.count !== null ? ` (${t.count})` : ''}`)
      .join('\n') + '\n';
    md += `\nUse these as themes only. Do not invent a quote.\n`;
  }
  if (brief.photos.length) {
    md += `\n## Photos (${brief.photos.length})\n\n`;
    md += `Downloaded to \`photos/\` — attach these to the Framer Agent prompts.\n`;
  }
  return md;
}
