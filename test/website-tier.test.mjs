import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyWebsite } from '../scripts/lib/website-tier.mjs';

test('missing website key is none', () => {
  assert.equal(classifyWebsite({ title: 'X' }), 'none');
});

test('empty, whitespace and null websites are none', () => {
  assert.equal(classifyWebsite({ website: '' }), 'none');
  assert.equal(classifyWebsite({ website: '   ' }), 'none');
  assert.equal(classifyWebsite({ website: null }), 'none');
});

test('unparseable website is none', () => {
  assert.equal(classifyWebsite({ website: 'not a url' }), 'none');
});

test('real business site is has_site', () => {
  assert.equal(classifyWebsite({ website: 'https://www.aesthmed.ca/' }), 'has_site');
  assert.equal(classifyWebsite({ website: 'http://greenclinic.ca/' }), 'has_site');
  assert.equal(classifyWebsite({ website: 'cedarstonelandscape.com' }), 'has_site');
});

test('socials, aggregators and dead builders are social_only', () => {
  for (const url of [
    'https://www.instagram.com/lisasnailspa_/',
    'https://m.facebook.com/lakepearlnailspa/',
    'https://linktr.ee/tmiv.clinic?utm_source=x',
    'https://meenazbeautyspa.wixsite.com/home',
    'https://mysite.vagaro.com/skinfluence2',
    'https://foo.business.site',
    'https://sites.google.com/view/foo',
    'https://www.yelp.com/biz/foo',
    'https://www.thumbtack.com/tx/san-antonio/foo',
    'https://www.angi.com/companylist/us/tx/foo.htm',
  ]) assert.equal(classifyWebsite({ website: url }), 'social_only', url);
});

test('subdomain of a real business is still has_site', () => {
  assert.equal(classifyWebsite({ website: 'https://shop.mylandscaping.com' }), 'has_site');
});

test('a host merely containing a blocked name is not matched', () => {
  assert.equal(classifyWebsite({ website: 'https://yelpbusters.com' }), 'has_site');
  assert.equal(classifyWebsite({ website: 'https://notfacebook.com' }), 'has_site');
});
