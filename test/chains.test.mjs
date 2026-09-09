import test from 'node:test';
import assert from 'node:assert/strict';
import { isChain } from '../scripts/lib/chains.mjs';

test('national lawn, tree and pest franchises are chains', () => {
  for (const name of [
    'TruGreen San Antonio', 'Weed Man Lawn Care', 'Lawn Doctor of Bexar County',
    'U.S. Lawns', 'US Lawns of San Antonio', 'Bartlett Tree Experts',
    'Davey Tree Expert Company', 'BrightView Landscape Services',
    'Mosquito Joe of North San Antonio', 'The Grounds Guys of Alamo Heights',
    'LawnStarter', 'Lawn Love', 'Yellowstone Landscape', 'Monster Tree Service',
    'NaturaLawn of America', 'Spring-Green Lawn Care', 'Terminix', 'Orkin Pest Control',
  ]) assert.equal(isChain(name), true, name);
});

test('independents are not chains', () => {
  for (const name of [
    'Cedar & Stone Landscape Co.', 'Alamo Lawn & Garden', 'Green Thumb Landscaping',
    'Hill Country Outdoor Living', 'Rodriguez Landscape Design', 'Stone Oak Lawn Care',
  ]) assert.equal(isChain(name), false, name);
});

test('handles empty, missing and non-string names', () => {
  assert.equal(isChain(''), false);
  assert.equal(isChain(undefined), false);
  assert.equal(isChain(null), false);
});
