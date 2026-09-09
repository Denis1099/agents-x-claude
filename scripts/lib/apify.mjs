import { ApifyClient } from 'apify-client';

export function makeApifyClient(token) {
  if (!token) throw new Error('APIFY_TOKEN is missing. Copy .env.example to .env and set it.');
  return new ApifyClient({ token });
}

export async function runGooglePlacesForRegion(client, {
  actor, searchStringsArray, region, maxCrawledPlacesPerSearch,
  language, scrapeContacts, skipClosedPlaces, maxImages, maxTotalChargeUsd,
}) {
  const input = {
    searchStringsArray,
    locationQuery: region,
    maxCrawledPlacesPerSearch,
    language,
    scrapeContacts,
    scrapeDirectories: false,
    skipClosedPlaces,
    exportPlaceUrls: false,
    // Without maxImages the actor returns imagesCount but leaves imageUrls
    // EMPTY — verified across 802 real records. The builder needs real photos
    // to attach to the Framer prompts, so this is not optional.
    maxImages,
  };

  console.log(`[apify] starting ${actor} for region=${region}`);
  // Hard ceiling on spend. The actor is pay-per-event, so without this a bad
  // config can quietly drain the account balance.
  const run = await client.actor(actor).call(input, { maxTotalChargeUsd });
  console.log(`[apify] run ${run.id} finished status=${run.status}`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`[apify] ${items.length} places for ${region}`);
  return items;
}
