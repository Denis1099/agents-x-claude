import test from 'node:test';
import assert from 'node:assert/strict';
import { qualify, scorePlace, photoCount } from '../scripts/lib/qualify.mjs';
import { PLACES, STRONG_TARGET, SPARSE_BUT_VALID } from './fixtures/places.mjs';

test('photoCount prefers imageUrls length, falls back to imagesCount', () => {
  assert.equal(photoCount({ imageUrls: ['a', 'b'], imagesCount: 99 }), 2);
  assert.equal(photoCount({ imagesCount: 7 }), 7);
  assert.equal(photoCount({ imageUrls: [], imagesCount: 4 }), 4);
  assert.equal(photoCount({}), 0);
});

test('score weights photos most heavily: 20 photos is worth 60 points', () => {
  const many = { imageUrls: Array(20).fill('u'), reviewsCount: 25, totalScore: 4.5 };
  const none = { imageUrls: [], reviewsCount: 25, totalScore: 4.5 };
  assert.equal(scorePlace(many, 'social_only') - scorePlace(none, 'social_only'), 60);
});

test('score caps photos at 20 and reviews at 200', () => {
  const capped = { imageUrls: Array(20).fill('u'), reviewsCount: 200, totalScore: 4.5 };
  const huge = { imageUrls: Array(999).fill('u'), reviewsCount: 9999, totalScore: 4.5 };
  assert.equal(scorePlace(capped, 'none'), scorePlace(huge, 'none'));
});

test('tier none earns a 15 point bonus over social_only', () => {
  const p = { imageUrls: [], reviewsCount: 0, totalScore: 4.5 };
  assert.equal(scorePlace(p, 'none') - scorePlace(p, 'social_only'), 15);
});

test('scorePlace never throws on the null fields real data contains', () => {
  assert.equal(Number.isFinite(scorePlace(SPARSE_BUT_VALID, 'none')), true);
  assert.equal(Number.isFinite(scorePlace({}, 'none')), true);
});

test('each rejection states which gate failed', () => {
  const { rejected } = qualify(PLACES);
  const reasons = Object.fromEntries(rejected.map((r) => [r.title, r.reason]));
  assert.equal(reasons['Has A Real Site LLC'], 'has_site');
  assert.equal(reasons['TruGreen San Antonio'], 'chain');
  assert.equal(reasons['Null Rating Landscaping'], 'rating');
  assert.equal(reasons['Barely Reviewed Yards'], 'reviews');
  assert.equal(reasons['Closed Down Lawn Care'], 'closed');
  assert.equal(reasons['No Phone Yard Co'], 'no_phone');
});

test('qualifying targets carry their place, tier and score', () => {
  const { targets } = qualify(PLACES);
  const titles = targets.map((t) => t.place.title);
  assert.deepEqual(titles.sort(), [
    'Alamo Lawn & Garden', 'Bare Listing Landscapes', 'Cedar & Stone Landscape Co.',
  ]);
  const cedar = targets.find((t) => t.place === STRONG_TARGET);
  assert.equal(cedar.tier, 'none');
  assert.ok(cedar.score > 0);
});

test('targets are sorted by score descending, best demo target first', () => {
  const { targets } = qualify(PLACES);
  const scores = targets.map((t) => t.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.equal(targets[0].place.title, 'Cedar & Stone Landscape Co.');
});

test('thresholds are configurable', () => {
  // Raising the rating floor to 4.9 drops the 4.7 and 4.6 targets; dropping the
  // review floor to 1 lets the 5.0-rated, 3-review place back in.
  const { targets } = qualify(PLACES, { minReviews: 1, minRating: 4.9 });
  assert.deepEqual(targets.map((t) => t.place.title),
    ['Cedar & Stone Landscape Co.', 'Barely Reviewed Yards']);
});

test('allowTiers can be narrowed to the cleanest demo story', () => {
  const { targets } = qualify(PLACES, { allowTiers: ['none'] });
  assert.equal(targets.every((t) => t.tier === 'none'), true);
});
