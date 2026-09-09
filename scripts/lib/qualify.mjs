import { classifyWebsite } from './website-tier.mjs';
import { isChain } from './chains.mjs';

export const DEFAULT_OPTS = {
  minRating: 4.5,
  minReviews: 25,
  allowTiers: ['none', 'social_only'],
};

/**
 * Photos available for the site build.
 *
 * `imageUrls` is what we can actually download and hand to Framer's Agent, so
 * it wins when present. `imagesCount` is the listing's own count and is the
 * fallback when the actor returned a count but no URLs.
 */
export function photoCount(place) {
  const urls = place?.imageUrls;
  if (Array.isArray(urls) && urls.length) return urls.length;
  return Number(place?.imagesCount) || 0;
}

/**
 * Ranks a qualifying place for demo suitability.
 *
 * Photos dominate deliberately. Filtering alone is not enough: a 4.9-star
 * landscaper with zero photos passes every gate and still makes a terrible
 * site, because the Agent has nothing real to build with. Twenty photos is
 * worth 60 points; a perfect rating is worth 10.
 */
export function scorePlace(place, tier) {
  const photos = Math.min(photoCount(place), 20) * 3;
  const reviews = Math.min(Number(place?.reviewsCount) || 0, 200) / 4;
  const rating = Math.max((Number(place?.totalScore) || 0) - 4.5, 0) * 20;
  const tierBonus = tier === 'none' ? 15 : 0;
  const hours = Array.isArray(place?.openingHours) && place.openingHours.length ? 10 : 0;
  const address = place?.address ? 8 : 0;
  return photos + reviews + rating + tierBonus + hours + address;
}

/**
 * Returns the first gate a place fails, or null if it passes them all.
 * Order matters. It decides which reason gets reported.
 */
function rejectionReason(place, tier, opts) {
  if (isChain(place?.title)) return 'chain';
  if (place?.permanentlyClosed || place?.temporarilyClosed) return 'closed';
  if (!opts.allowTiers.includes(tier)) return tier === 'has_site' ? 'has_site' : tier;
  const rating = Number(place?.totalScore);
  if (!Number.isFinite(rating) || rating < opts.minRating) return 'rating';
  const reviews = Number(place?.reviewsCount);
  if (!Number.isFinite(reviews) || reviews < opts.minReviews) return 'reviews';
  if (!place?.phone && !place?.phoneUnformatted) return 'no_phone';
  return null;
}

/**
 * @param {object[]} places - raw actor records
 * @param {object} [options] - overrides for DEFAULT_OPTS
 * @returns {{targets: {place: object, tier: string, score: number}[],
 *            rejected: {title: string, reason: string}[]}}
 */
export function qualify(places, options = {}) {
  const opts = { ...DEFAULT_OPTS, ...options };
  const targets = [];
  const rejected = [];

  for (const place of places ?? []) {
    const tier = classifyWebsite(place);
    const reason = rejectionReason(place, tier, opts);
    if (reason) {
      rejected.push({ title: place?.title ?? '(untitled)', reason });
      continue;
    }
    targets.push({ place, tier, score: scorePlace(place, tier) });
  }

  targets.sort((a, b) => b.score - a.score);
  return { targets, rejected };
}
