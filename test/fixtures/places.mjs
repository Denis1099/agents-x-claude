/**
 * Synthetic places mirroring the real field shapes of the Apify actor
 * `compass/crawler-google-places`.
 *
 * Synthetic on purpose: the real validation corpus is a client scrape that
 * must not be committed. Every null and empty case below was observed in that
 * corpus, so this file is a faithful stand-in without shipping anyone's data.
 * The opt-in test in real-data.test.mjs checks against the real file locally.
 */

const photos = (n) => Array.from({ length: n }, (_, i) => `https://example.test/p${i}.jpg`);

export const STRONG_TARGET = {
  title: 'Cedar & Stone Landscape Co.',
  categoryName: 'Landscaper',
  categories: ['Landscaper', 'Lawn care service'],
  city: 'San Antonio', state: 'TX',
  address: '1200 Broadway, San Antonio, TX 78215',
  neighborhood: 'Tobin Hill',
  phone: '+1 210-555-0142',
  totalScore: 4.9, reviewsCount: 87,
  imageUrls: photos(30), imagesCount: 30,
  openingHours: [{ day: 'Monday', hours: '8 AM to 5 PM' }],
  reviewsTags: [{ title: 'patio', count: 14 }, { title: 'prices', count: 9 }],
  url: 'https://maps.google.com/?cid=1', placeId: 'cedar1',
  // no `website` key at all. The actor omits it
};

export const SOCIAL_ONLY_TARGET = {
  title: 'Alamo Lawn & Garden',
  categoryName: 'Lawn care service', categories: ['Lawn care service'],
  city: 'San Antonio', state: 'TX', address: '55 Alamo Plaza, San Antonio, TX',
  phone: '+1 210-555-0199',
  website: 'https://www.instagram.com/alamolawn/',
  totalScore: 4.7, reviewsCount: 140,
  imageUrls: photos(12), imagesCount: 12,
  openingHours: [{ day: 'Monday', hours: '7 AM to 6 PM' }],
  reviewsTags: [], url: 'https://maps.google.com/?cid=2', placeId: 'alamo1',
};

export const HAS_SITE = {
  title: 'Has A Real Site LLC',
  phone: '+1 210-555-0100', website: 'https://hasarealsite.com',
  totalScore: 4.8, reviewsCount: 60, imageUrls: photos(10),
};

export const CHAIN = {
  title: 'TruGreen San Antonio',
  phone: '+1 210-555-0101',
  totalScore: 4.6, reviewsCount: 300, imageUrls: photos(20),
};

export const NULL_RATING = {
  title: 'Null Rating Landscaping',
  phone: '+1 210-555-0102',
  totalScore: null, reviewsCount: null, imagesCount: 0, openingHours: [],
};

export const LOW_REVIEWS = {
  title: 'Barely Reviewed Yards',
  phone: '+1 210-555-0103',
  totalScore: 5, reviewsCount: 3, imageUrls: photos(5),
};

export const CLOSED = {
  title: 'Closed Down Lawn Care',
  phone: '+1 210-555-0104', permanentlyClosed: true,
  totalScore: 4.9, reviewsCount: 200, imageUrls: photos(20),
};

export const NO_PHONE = {
  title: 'No Phone Yard Co',
  totalScore: 4.9, reviewsCount: 90, imageUrls: photos(20),
};

export const SPARSE_BUT_VALID = {
  title: 'Bare Listing Landscapes',
  phone: '+1 210-555-0105',
  city: null, address: null,
  totalScore: 4.6, reviewsCount: 31,
  imagesCount: 0, openingHours: [],
  categories: null, reviewsTags: null,
};

export const PLACES = [
  STRONG_TARGET, SOCIAL_ONLY_TARGET, HAS_SITE, CHAIN,
  NULL_RATING, LOW_REVIEWS, CLOSED, NO_PHONE, SPARSE_BUT_VALID,
];
