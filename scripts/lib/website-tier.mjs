/**
 * Classifies the `website` field on a Google Maps place into three tiers.
 *
 * The whole finder hangs off this. Two facts about the actor's output drive
 * the implementation, both verified against a real 802-record scrape:
 *   1. `compass/crawler-google-places` OMITS the `website` key entirely when
 *      a listing has none. It does not return null. Never test for null alone.
 *   2. Roughly a third of the businesses that DO have a `website` are really
 *      pointing at Instagram, a Linktree, or a dead site builder. Those are
 *      the best outreach targets of all, so they get their own tier rather
 *      than being lumped in with real sites.
 */

/**
 * Hosts that are not a real business website. Matched by exact host or by
 * subdomain suffix, never by substring. `yelpbusters.com` is a real site.
 */
export const NON_SITE_HOSTS = [
  // Social profiles
  'instagram.com', 'facebook.com', 'fb.com', 'fb.me', 'twitter.com', 'x.com',
  'tiktok.com', 'youtube.com', 'youtu.be', 'pinterest.com', 'nextdoor.com',
  'threads.net', 'snapchat.com',
  // Link-in-bio
  'linktr.ee', 'linkin.bio', 'beacons.ai', 'bio.link', 'campsite.bio', 'msha.ke',
  // Directories and lead aggregators
  'yelp.com', 'angi.com', 'angieslist.com', 'homeadvisor.com', 'thumbtack.com',
  'houzz.com', 'porch.com', 'bbb.org', 'yellowpages.com', 'manta.com',
  'chamberofcommerce.com', 'nicelocal.com', 'birdeye.com', 'alignable.com',
  // Booking tools standing in for a site
  'booksy.com', 'vagaro.com', 'fresha.com', 'square.site', 'squareup.com',
  'setmore.com', 'calendly.com', 'schedulicity.com', 'housecallpro.com',
  'getjobber.com', 'jobber.com',
  // Dead or hobby site builders. `business.site` was Google's own builder,
  // discontinued in 2024. Every one of these is a dead link today.
  'business.site', 'sites.google.com', 'wixsite.com', 'weebly.com',
  'godaddysites.com', 'blogspot.com', 'wordpress.com', 'webador.com',
  'carrd.co', 'my-free.website', 'company.site', 'webnode.com', 'jimdosite.com',
];

function hostOf(rawWebsite) {
  if (typeof rawWebsite !== 'string') return null;
  const trimmed = rawWebsite.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const host = new URL(withScheme).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/**
 * @param {object} place - a raw place record from the Apify actor
 * @returns {'none'|'social_only'|'has_site'}
 */
export function classifyWebsite(place) {
  const host = hostOf(place?.website);
  if (!host) return 'none';
  const blocked = NON_SITE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return blocked ? 'social_only' : 'has_site';
}

/** The raw website string, normalized for display on a brief. */
export function websiteHost(place) {
  return hostOf(place?.website);
}
