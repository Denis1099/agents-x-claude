import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, buildBrief, briefToMarkdown } from '../scripts/lib/brief.mjs';
import { STRONG_TARGET, SOCIAL_ONLY_TARGET } from './fixtures/places.mjs';

test('slugify handles punctuation, ampersands and stray whitespace', () => {
  assert.equal(slugify('Cedar & Stone Landscape Co.'), 'cedar-stone-landscape-co');
  assert.equal(slugify('  Multiple   Spaces  '), 'multiple-spaces');
  assert.equal(slugify("O'Brien's Lawn/Garden"), 'o-brien-s-lawn-garden');
});

test('buildBrief tolerates every null field seen in real data', () => {
  const brief = buildBrief({
    place: {
      title: 'Bare Listing Co', totalScore: null, reviewsCount: null, city: null,
      openingHours: [], imagesCount: 0, categories: null, reviewsTags: null,
      placesTags: null, address: null,
    },
    tier: 'none', score: 12,
  });
  assert.equal(brief.slug, 'bare-listing-co');
  assert.deepEqual(brief.hours, []);
  assert.deepEqual(brief.photos, []);
  assert.deepEqual(brief.serviceTags, []);
  assert.deepEqual(brief.reviewThemes, []);
  assert.equal(brief.rating, null);
});

test('buildBrief normalizes both tag shapes to {tag,count}', () => {
  const fromObjects = buildBrief({
    place: { title: 'X', reviewsTags: [{ title: 'patio', count: 14 }] }, tier: 'none', score: 1,
  });
  assert.deepEqual(fromObjects.reviewThemes, [{ tag: 'patio', count: 14 }]);

  const fromStrings = buildBrief({
    place: { title: 'X', reviewsTags: ['patio', 'prices'] }, tier: 'none', score: 1,
  });
  assert.deepEqual(fromStrings.reviewThemes, [{ tag: 'patio', count: null }, { tag: 'prices', count: null }]);
});

test('serviceTags merge categories and placesTags without duplicates', () => {
  const brief = buildBrief({
    place: {
      title: 'X', categoryName: 'Landscaper',
      categories: ['Landscaper', 'Lawn care service'],
      placesTags: [{ title: 'Lawn care service' }, { title: 'Irrigation' }],
    }, tier: 'none', score: 1,
  });
  assert.deepEqual(brief.serviceTags, ['Landscaper', 'Lawn care service', 'Irrigation']);
});

test('photos get sequential local paths and cap at 12', () => {
  const brief = buildBrief({
    place: { title: 'X', imageUrls: Array.from({ length: 30 }, (_, i) => `https://e/${i}.jpg`) },
    tier: 'none', score: 1,
  });
  assert.equal(brief.photos.length, 12);
  assert.equal(brief.photos[0].localPath, 'photos/01.jpg');
  assert.equal(brief.photos[11].localPath, 'photos/12.jpg');
  assert.equal(brief.photos[0].url, 'https://e/0.jpg');
});

test('whyQualified names the real numbers and the no-website fact', () => {
  const brief = buildBrief({ place: STRONG_TARGET, tier: 'none', score: 122 });
  assert.match(brief.whyQualified, /4\.9/);
  assert.match(brief.whyQualified, /87/);
  assert.match(brief.whyQualified, /30/);
  assert.match(brief.whyQualified, /no website/i);
});

test('whyQualified names the stand-in host for a social_only target', () => {
  const brief = buildBrief({ place: SOCIAL_ONLY_TARGET, tier: 'social_only', score: 90 });
  assert.match(brief.whyQualified, /instagram\.com/);
  assert.equal(brief.websiteTier, 'social_only');
  assert.equal(brief.websiteRaw, 'https://www.instagram.com/alamolawn/');
});

test('briefToMarkdown renders the name as an h1 and includes the phone', () => {
  const md = briefToMarkdown(buildBrief({ place: STRONG_TARGET, tier: 'none', score: 122 }));
  assert.match(md, /^# Cedar & Stone Landscape Co\./m);
  assert.match(md, /\+1 210-555-0142/);
  assert.match(md, /Tobin Hill/);
});
