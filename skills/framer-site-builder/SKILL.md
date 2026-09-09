---
name: framer-site-builder
description: Use when asked to find a local business with no website and build them a site, to run the Agents x Claude workflow, or to turn a Google Maps listing or target brief into a published Framer site.
---

# Agents x Claude. listing to live site

Find a high-rated local business with no website. Design them a site. Build it
in Framer and publish it. **You do the designing.** There is no template.

Run from `~/Documents/business/projects/framer-agents-leadgen`.

## 1. Find the business

```bash
npm run find -- --config config/<vertical>.json   # COSTS MONEY
npm run qualify                                   # free, re-runnable
npm run photos                                    # free
```

`qualify` prints the demo target and its slug. Everything lands in
`data/briefs/<slug>/`.

**Before scraping:** it costs about **$0.011 per place** on the Apify free
tier. Run `npm run find -- --dry-run` for an estimate and tell the user the
number before spending. If `data/raw-<today>.json` already exists, do not
re-scrape. `qualify` is free against it, so loosen `minReviews` in the config
instead.

To scrape a new vertical or city, copy an existing config in `config/` and edit
`searchStringsArray` and `regions`.

## 2. Look at the business before designing anything

Read `data/briefs/<slug>/brief.md`, then **open three or four of their photos**
with the Read tool from `data/briefs/<slug>/photos/`.

This is the step that makes the work specific. You are looking for:

- **The real materials.** What is physically in their photographs. Cedar,
  caliche, chrome, steel, flour, tile, brick, chalkboard, neon. This is where
  the palette comes from.
- **What kind of business this actually is.** A listing with eight trades is a
  contractor. One with a queue out the door is a counter service.
- **What reviewers keep saying.** `reviewThemes` tells you what to lead with.

## 3. Design it for this business

Write a design direction before writing any DSL, and state it in one short
paragraph so the user can see the reasoning:

- **Palette.** Sample it from their own photographs. Name 4 to 6 hex values and
  say what each came from. Never reuse a palette from a previous run.
- **Type.** Search Framer's library for a pairing that fits this trade. Do not
  default to a serif display face, and do not reach for Oswald.
  ```js
  await framer.agent.readProject([{ type: 'font-search', query: '<register>', limit: 6, mustHave: ['sans-serif'] }])
  ```
- **Structure.** Pick the sections this business needs, in the order that serves
  it. A contractor needs a service list and a gallery. A bakery needs hours and
  a menu and probably no service list at all. Do not assume six sections.
- **A signature.** One element that could only belong to this business.

**Design only from what is in front of you.** The brief and the photographs are
the source. Do not look for a previous run to pattern-match against, and do not
open `fallback/`. It holds one frozen layout for emergencies, and reading it
will pull your design toward it.

Two defaults to avoid because they are habits rather than decisions: a cream
background with a high-contrast serif and a terracotta accent, and a dark page
with a single acid accent. If your direction is drifting toward either, you are
decorating rather than designing for this business.

## 4. Build it

Create a fresh Framer project for this build so previous sites are kept:

```bash
npx @framer/agent@latest project new        # approve once in the browser
npx @framer/agent@latest session new "<returned project id>"
```

`project new` opens a browser approval dialog. That is fine when a human is
present, and it is the right default. each run keeps its own site.

**For an unattended or live-demo run**, set `FRAMER_PROJECT_ID` in `.env` to a
pre-authorized project and use `session new "$FRAMER_PROJECT_ID"` instead. That
skips the click, but the build wipes that project's page every time, so
whatever was there before is gone.

**Load the `framer` skill**. Framer's own. `session new` regenerates the DSL
grammar, design rules, and worked examples into it for this project. That is
your reference for writing canvas DSL; do not guess at the syntax.

Then discover the page, wipe it, and apply your DSL:

```js
// getContext() returns a null site map. discover the page this way.
const pages = await framer.agent.getNodesOfTypes({ types: ['WebPageNode'] });
const page  = pages.find(p => p.attributes?.path === '/') ?? pages[0];
const node  = (await framer.agent.getNodes({ ids: [page.id] }))[0];
const breakpointId = node.$breakpoints[0].id;

// Styles are project-scoped, not page children. a page wipe leaves them and
// presets stack up as duplicate "Display" entries across runs. Delete both.
const styles = await framer.agent.getNodesOfTypes({ types: ['ColorStyleTokenNode', 'TextStylePresetNode'] });
```

### Apply one section at a time, not all at once

`DEL` every existing section and style first, and set the page breakpoint to
`layout="stack"` and `height="auto"`.

Then send **a separate `applyChanges` call per section**, in page order:
foundation (colour tokens and text presets), hero, then each section down the
page, then the breakpoints last.

This matters more than it looks. A single call carrying the whole site makes
the canvas jump from empty to finished with nothing to watch, which is useless
when someone is looking at the screen. Section by section, the page visibly
grows. It is also what Framer's own guidance recommends, and it catches a bad
section immediately instead of after the whole page is built.

Say what you are building before each call, in one short line ("Hero, using
their gravel-path photo"). The person watching should never be looking at a
still screen wondering whether it is working.

Total time is about the same. It just stops looking like nothing is happening.

### Build the breakpoints. do not leave this to Framer

A page created this way has only a Desktop breakpoint. Adding tablet and phone
by hand afterwards produces variants that inherit the desktop layout and do not
adapt, which looks worse than not adding them at all.

Create them in the same `applyChanges` call and override what actually breaks:

```
CREATE_VARIANT tablet from="<breakpointId>"; SET tablet name="Tablet" width="810px";
CREATE_VARIANT phone  from="<breakpointId>"; SET phone  name="Phone"  width="390px";
```

Replica variant node ids are the variant id prefixed to the node id. a node
`heroBody` becomes `tabletheroBody` and `phoneheroBody`. Override per breakpoint:

- Section padding down (e.g. `104px 56px` desktop → `64px 24px` phone).
- Horizontal splits to `stackDirection="vertical"`, and drop the `minWidth`
  that was holding two columns apart.
- Grids to fewer columns: `gridColumnCount="2"` tablet, `"1"` phone.
- Fixed section heights (`88vh`) to `height="auto"` on phone.
- Anything absolutely positioned. re-check it, it will not move on its own.
- **Every `minWidth` wider than the phone frame.** This is the one that bites:
  a column with `minWidth="420px"` inside a 390px phone forces horizontal
  overflow and clips content off the right edge. Sweep the phone variant for
  any `minWidth` over ~330px and set it to `0px`.

Within a single `applyChanges` call you can address replica nodes by the temp
variant id you just created (`SET ph<nodeId> ...`). Across separate calls you
must use the real breakpoint id as the prefix, which `applyChanges` returns in
`renamedIds`.

Text sizes come from the presets' `breakpoint.medium/small` slots, so set those
when you create the presets and you do not need per-node type overrides.

If you are reusing a project rather than creating one, `DEL` its existing
sections and styles first. otherwise sections stack up and text presets
duplicate.

Building this way consumes **no Framer AI credits**. you generate DSL, Framer
applies it. `framer.agent.startConversation` (prompting Framer's own on-canvas
agent) is gated to Framer employees and will fail.

## 5. Copy rules. not negotiable

Every claim must trace to a field in the brief. The business has not been
consulted and the result gets published to a public URL.

**Never invent:** testimonial quotes (not "representative" ones, not ones
labelled placeholder. proof is the real rating, real review count, and real
`reviewThemes`), years in business, founding dates, awards, certifications,
licences, insurance, staff names or headcounts, prices, guarantees, or service
areas beyond the listing.

**Always include** a footer line marking the page an unaffiliated concept built
from public listing data. Publishing without it is not acceptable.

| Rationalization | Reality |
|---|---|
| "A placeholder quote shows the layout" | It ships looking real. Use the rating. |
| "Every contractor is licensed and insured" | You don't know that about this one. |
| "The section looks thin without a founding year" | Thin is a layout problem. Fix it with layout. |
| "It's just a demo" | It goes to a public URL. Assume the owner sees it. |

## 6. Verify, then publish

Check `applyChanges` diagnostics and fix every warning. Then **look at it**  
zero warnings is not the same as a good page:

```js
await framer.agent.readProject([{ type: 'screenshot', id: breakpointId }])
```

Full-page screenshots run ~4700px tall. Crop into bands with `sips` before
reading or the middle sections are unreadable. Check for columns that collide,
text over photos that lost contrast, grids with a ragged tail, and repetitive
copy.

Publish only after the disclaimer exists:

```js
const prev = await framer.agent.publish({ action: 'preview' });
await framer.agent.publish({ action: 'confirm_publish', confirmationHash: prev.confirmationHash });
```

Report the live URL.

## Known traps

- **Oversized display numerals overflow an auto-width column.** A 150px stat in
  a `width="auto"` column clips into the column beside it. Give the column an
  explicit `minWidth` wider than the numeral.
- **`sips -c` crops from the centre, not the top.** To read a section, screenshot
  that section's node id rather than cropping the full page.
- **Section node ids change on every rebuild**. the wipe deletes and recreates
  them. Re-read ids after applying; never reuse ids from an earlier run.
- **Shell-escaping DSL inside `node -e` will corrupt it.** Write the generator to
  a file and run the file.
- **The page has one Desktop breakpoint by default.** Text presets carry
  `breakpoint.medium/small` sizes, but layout does not reflow on its own. use
  `stackWrapEnabled="true"` and `minWidth` on split layouts so columns stack
  instead of squashing.

## Fallback

If a live run goes wrong and you need a site fast:

```bash
node scripts/4-build.mjs <slug> --publish
```

This renders one frozen layout regardless of the business. It is a rescue for a
failed live run with someone waiting. never the normal path, and not something
to read for inspiration.
