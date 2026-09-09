# Agents x Claude

Find a local business with a great Google rating and no website. Design them a
site. Build it in Framer and publish it. One prompt, a few minutes, and every
site comes out different.

Built for Framer's Agents Hackathon, rebuilt as a Claude Skill anyone can run.

## What it does

Two halves joined by a single file.

The finder scrapes Google Maps for a category and city, drops anyone who
already has a website or a weak rating, and ranks whoever is left. It writes a
brief with the name, rating, services, hours and phone, then downloads the
business's photos.

The builder reads that brief, opens the photos, and designs a site around what
it sees. It writes the result onto a Framer canvas through Framer's agent API
and publishes it.

Claude does the designing. Framer applies the result. No Framer AI credits are
used.

## Every site is designed for that business

There is no template. The palette comes from the business's own photographs.
A landscaper whose work is black mulch against tan limestone gets a different
page from one who works in decomposed granite and cedar, because those are the
colours in their photos.

Structure follows the listing too. One landscaper had eight services on Google
and got a services section. Another two miles away had one service and did not.
The data decided, not a style preference.

## Ranking picks the business worth building for

Filtering alone is not enough. A business can hold 4.9 stars, have no website,
and still make a terrible site, because the listing carries no photos and the
builder has nothing real to work with.

So the ranking scores what each listing gives you to build with. Photo count is
worth up to 60 points. The star rating is worth 10. The business that wins is
the one with the best shot at a good page, which is rarely the one with the
highest rating.

## What your first site costs

About 35 cents.

Apify charges roughly $0.011 per place scraped and gives you $5 free when you
sign up, so you can run this a dozen times before paying anything. Framer's
side is free.

| Scrape | No website | Qualified | Cost |
|---|---|---|---|
| 30 places (`config/trial.json`) | ~9 | 1 | $0.34 |
| 120 places | ~30 | 3 | $1.35 |

Start with the trial config. A bigger scrape does not find better businesses.
It just gives you more to choose from.

## Setup

```bash
npm install
cp .env.example .env      # add your APIFY_TOKEN
npx @framer/agent@latest setup
```

You need an [Apify](https://apify.com) account and a Framer account.

## Running it

Point Claude Code at this folder and ask:

> find me a business in Austin with no website and build them a site

The `framer-site-builder` skill takes it from there. You can also run the steps
yourself:

```bash
npm run find -- --config config/trial.json   # scrape, costs money
npm run qualify                              # filter and rank, free
npm run photos                               # download their photos, free
```

`find` is the only step that spends anything. That is why it is separate. You
can re-tune the filters against a scrape you already paid for as often as you
like.

## What counts as "no website"

Three tiers, in [`scripts/lib/website-tier.mjs`](scripts/lib/website-tier.mjs).

`none` means the listing has no website. The Apify actor omits the field
entirely rather than returning null, which is easy to get wrong.

`social_only` means the website is an Instagram page, a Linktree, a Booksy
booking page, or a dead `business.site`. These still qualify. Often they are
the better sales target, since the owner already pays for something.

`has_site` means a real domain. Rejected.

After the tiers come the gates, which check rating, review count, a phone
number, whether the business is open, and whether the name matches a national
franchise. Then the ranking runs.

How much each tier matters depends on the trade. In one San Antonio landscaping
scrape, 30% of listings had no website at all and none were social-only.
Landscapers either have a real site or nothing. A salon dataset came in at 18%,
with a real social-only slice.

## Honesty rules

These sites describe real businesses that have not been asked, and they get
published to a public URL.

The skill forbids inventing testimonial quotes, years in business, awards,
licences, certifications and prices. Proof is the real rating, the real review
count, and the real review themes Google reports. Every generated page carries
a footer marking it an unaffiliated concept built from public listing data.

Leave that in place.

## Tests

```bash
npm test
```

Fixtures are synthetic, written to match the shapes the Apify actor really
returns, including the nulls it returns in practice.

## Notes

`framer.agent.startConversation`, which would prompt Framer's on-canvas agent,
is restricted to Framer employees. This uses `applyChanges` instead.

Build the tablet and phone breakpoints explicitly. Adding them by hand
afterwards inherits the desktop layout without adapting it.

`fallback/` holds one frozen layout as a rescue for a failed live run. It is
not the normal path, and reading it will pull your design toward it.
