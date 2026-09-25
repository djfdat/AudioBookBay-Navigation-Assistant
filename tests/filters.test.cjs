const { test } = require('node:test');
const assert = require('node:assert/strict');
const filters = require('../abbna-filters.js');

const metadata = filters.parseMetadata({
  title: 'Harbour Lights - Ada Example',
  info: 'Category: Adults\u00a0 Historical Fiction\u00a0\nLanguage: EnglishKeywords: Coastal Mystery\u00a0 Family',
  content: 'Posted: 25 Sep 2026\nFormat: M4B / Bitrate: 128 Kbps\nFile Size: 500 MBs',
});
function withList(key, value, enabled = true) {
  const settings = filters.defaults();
  settings[key] = { enabled, items: [{ value, enabled: true }] };
  return settings;
}

test('new installations have empty disabled lists and disabled ranges', () => {
  const settings = filters.defaults();
  for (const key of filters.listKeys) assert.deepEqual(settings[key], { enabled: false, items: [] });
  for (const key of filters.rangeKeys) assert.equal(settings[key].enabled, false);
  assert.equal(filters.matches(metadata, settings), true);
  assert.equal(filters.matches(filters.parseMetadata({}), settings), true);
});

test('real listing metadata preserves multiword categories and author names', () => {
  assert.deepEqual(metadata, {
    categories: ['Adults', 'Historical Fiction'], keywords: 'Coastal Mystery\u00a0 Family',
    authors: ['Ada Example'], languages: ['English'], formats: ['M4B'],
    bitrate: 128, size: 500, dates: '2026-09-25',
  });
  assert.deepEqual(filters.parseMetadata({ content: 'Written by: Jane Example\nPosted: unknown' }).authors, ['Jane Example']);
});

test('category exclusions are exact, normalized, and independently switchable', () => {
  const settings = withList('categories', '  HISTORICAL   fiction  ');
  assert.equal(filters.matches(metadata, settings), false);
  settings.categories.items[0].enabled = false;
  assert.equal(filters.matches(metadata, settings), true);
  settings.categories.items[0].enabled = true;
  settings.categories.enabled = false;
  assert.equal(filters.matches(metadata, settings), true);
  assert.equal(filters.matches(metadata, withList('categories', 'Fiction')), true);
});

test('keywords use substrings within keyword metadata only', () => {
  assert.equal(filters.matches(metadata, withList('keywords', 'mYsTeRy')), false);
  assert.equal(filters.matches(metadata, withList('keywords', 'Adults')), true);
  assert.equal(filters.matches(metadata, withList('keywords', 'Harbour')), true);
});

test('authors exclude exact names and allowlists require an active match', () => {
  assert.equal(filters.matches(metadata, withList('authors', 'ada example')), false);
  assert.equal(filters.matches(metadata, withList('authors', 'Ada')), true);
  for (const [key, value] of [['languages', 'english'], ['formats', 'm4b']]) {
    const settings = withList(key, value);
    assert.equal(filters.matches(metadata, settings), true);
    assert.equal(filters.matches(filters.parseMetadata({}), settings), false);
    settings[key].items[0].enabled = false;
    assert.equal(filters.matches(filters.parseMetadata({}), settings), true);
    settings[key].items = [];
    assert.equal(filters.matches(metadata, settings), true);
  }
});

test('bitrate, size, and date ranges include both bounds', () => {
  for (const [key, value, outside] of [['bitrate', 128, 127], ['size', 500, 501], ['dates', '2026-09-25', '2026-09-26']]) {
    const settings = filters.defaults();
    Object.assign(settings[key], { enabled: true, min: value, max: value });
    assert.equal(filters.matches(metadata, settings), true);
    assert.equal(filters.matches({ ...metadata, [key]: outside }, settings), false);
    settings[key].min = settings[key].max = '';
    assert.equal(filters.matches({ ...metadata, [key]: outside }, settings), true);
  }
});

test('unknown values follow the corresponding range policy', () => {
  const unknown = filters.parseMetadata({ content: 'Posted: 31 Feb 2026\nBitrate: variable\nFile Size: ?' });
  assert.equal(unknown.dates, null);
  for (const key of ['size', 'bitrate']) {
    const settings = filters.defaults();
    settings[key].enabled = true;
    assert.equal(filters.matches(unknown, settings), true);
    settings[key].allowUnknown = false;
    assert.equal(filters.matches(unknown, settings), false);
  }
  const settings = filters.defaults();
  settings.dates = { enabled: true, min: '2026-01-01', max: '2026-12-31' };
  assert.equal(filters.matches(unknown, settings), true);
});

test('sizes normalize decimal and binary units to MB', () => {
  for (const [text, expected] of [['1.2 GBs', 1200], ['500 KB', .5], ['1 MiB', 1.048576], ['1,000 MBs', 1000], ['0 B', 0], ['1 TB', 1e6]]) {
    assert.equal(filters.parseMetadata({ content: `File Size: ${text}` }).size, expected);
  }
  assert.equal(filters.parseMetadata({ content: 'File Size: unknown' }).size, null);
});

test('validation rejects empty/duplicate items even when disabled and rejects bad bounds', () => {
  const settings = filters.defaults();
  settings.categories.items = [{ value: '', enabled: false }, { value: 'Adults', enabled: true }, { value: ' adults ', enabled: true }];
  settings.bitrate.min = -1;
  settings.size.min = 1001;
  settings.dates.min = '2026-02-30';
  const errors = filters.validate(settings);
  for (const path of ['categories.0', 'categories.2', 'bitrate.min', 'size.max', 'dates.min']) assert.ok(errors[path]);
  assert.deepEqual(filters.validate(filters.defaults()), {});
});

test('restore sanitizes partial/corrupt data without enabling defaults', () => {
  assert.deepEqual(filters.restore(null), filters.defaults());
  assert.deepEqual(filters.restore({ version: 99 }), filters.defaults());
  const settings = filters.restore({ version: 1, categories: { enabled: true, items: [null, { value: 'Adults', enabled: true }, { value: 'adults', enabled: true }] }, size: { enabled: true, min: NaN, max: 2 }, navigation: { skipEmpty: false } });
  assert.deepEqual(settings.categories.items, [{ value: 'Adults', enabled: true }]);
  assert.equal(settings.size.enabled, false);
  assert.equal(settings.navigation.skipEmpty, false);
  assert.equal(settings.navigation.nextAtEnd, true);
  assert.deepEqual(filters.restore(settings), settings);
});
