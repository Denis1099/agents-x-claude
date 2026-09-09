# Agents x Claude

Find a local business with a great Google rating and no website, then design and
publish them a Framer site. One prompt, a few minutes, and every site comes out
different.

Built for Framer's Agents Hackathon, rebuilt as a Claude Skill anyone can run.

## What it does

The finder scrapes Google Maps for a category and city, drops anyone who already
has a website or a weak rating, and ranks the rest. It writes a brief with the
name, rating, services, hours and phone, then downloads the business's photos.

The builder reads that brief, opens the photos, and designs a site around what
it sees. It writes the result onto a Framer canvas through Framer's agent API,
then publishes it.

Claude does the designing, Framer applies the result, and no Framer AI credits
are used.

## Every site is designed for that business

There is no template. The palette comes from the business's own photographs, so
a landscaper working in black mulch and tan limestone gets a different page from
one working in decomposed granite and cedar.

Structure follows the listing too. One landscaper had eight services on Google
and got a services section; another two miles away had one service and didn't.

## Ranking picks the business worth building for

Filtering isn't enough. A business can hold 4.9 stars, have no website, and
still make a terrible site, because the listing carries no photos and there's
nothing real to build with.

So the ranking scores what each listing gives you: photos are worth up to 60
points, the star rating is worth 10. The winner is the business with the best
shot at a good page, which is rarely the highest-rated one.

## What your first site costs

About 35 cents. Apify charges roughly $0.011 per place and gives you $5 free
when you sign up, so you can run this a dozen times before paying anything.
Framer's side is free.

| Scrape | No website | Qualified | Cost |
|---|---|---|---|
| 30 places (`config/trial.json`) | ~9 | 1 | $0.34 |
| 120 places | ~30 | 3 | $1.35 |

Start with the trial config. A bigger scrape doesn't find better businesses, it
just gives you more to choose from.

## Setup

The quickest way is to hand this repo to an AI editor. Point Claude Code, Cursor
or Codex at the URL and ask it to set the project up, then follow along as it
walks you through the two accounts you need.

Or do it yourself:

```bash
npm install
cp .env.example .env      # add your APIFY_TOKEN
npx @framer/agent@latest setup
```

You'll need an [Apify](https://apify.com) account for the scraping and a Framer
account for the site. Both are free to start.

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

`find` is the only step that spends anything, which is why it's separate. You
can re-tune the filters against a scrape you already paid for as often as you
like.

## What counts as "no website"

Three tiers, in [`scripts/lib/website-tier.mjs`](scripts/lib/website-tier.mjs):

- **`none`**, the listing has no website. The Apify actor omits the field
  entirely rather than returning null, which is easy to get wrong.
- **`social_only`**, the website is an Instagram page, a Linktree, a Booksy
  page, or a dead `business.site`. These still qualify, and they're often the
  better sales target since the owner already pays for something.
- **`has_site`**, a real domain. Rejected.

Then the gates check rating, review count, a phone number, whether the business
is open, and whether the name matches a national franchise. Then it ranks.

How much each tier matters depends on the trade. In one San Antonio landscaping
scrape, 30% of listings had no website at all and none were social-only;
landscapers either have a real site or nothing. A salon dataset came in at 18%,
with a real social-only slice.

## Honesty rules

These sites describe real businesses that haven't been asked, and they get
published to a public URL.

The skill forbids inventing testimonial quotes, years in business, awards,
licences, certifications and prices. Proof is the real rating, the real review
count, and the review themes Google reports. Every page carries a footer marking
it an unaffiliated concept built from public listing data. Leave that in place.

## Tests

```bash
npm test
```

Fixtures are synthetic, written to match the shapes the Apify actor really
returns, including the nulls it returns in practice.

## Notes

`framer.agent.startConversation`, which would prompt Framer's on-canvas agent,
is restricted to Framer employees, so this uses `applyChanges` instead.

Build the tablet and phone breakpoints explicitly. Adding them by hand
afterwards inherits the desktop layout without adapting it.

`fallback/` holds one frozen layout as a rescue for a failed live run. It isn't
the normal path, and reading it will pull your design toward it.
