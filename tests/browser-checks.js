// Pass this function to Playwright CLI's run-code command on the served fixture.
async (page) => {
  const results = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    results.push(message);
  };
  const base = 'http://127.0.0.1:8765/tests/fixtures/listings.html';
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const ui = page.locator('#abbna-settings');
  const gear = ui.getByRole('button', { name: 'Open AudioBookBay settings' });
  const panel = ui.getByRole('dialog');
  const open = async () => { await gear.click(); };
  const section = async (name) => { await ui.locator('summary').filter({ hasText: new RegExp(`^${name}`) }).click(); };
  const apply = async () => { await ui.getByRole('button', { name: 'Apply', exact: true }).click(); };
  const visible = () => page.locator('#content > .post:visible').evaluateAll(nodes => nodes.map(node => node.id));
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('fixtureSettings')).abbnaSettings);

  await open();
  assert(await panel.isVisible(), 'Gear opens the native popover');
  await section('Categories');
  await ui.getByRole('button', { name: '+ Add category', exact: true }).click();
  await ui.getByRole('textbox', { name: 'Category 1', exact: true }).fill('Adults');
  await ui.getByLabel('Enable categories filter', { exact: true }).check();
  assert((await visible()).length === 3, 'Draft changes do not filter before Apply');
  await apply();
  assert(!(await panel.isVisible()), 'Apply closes the popover');
  assert(JSON.stringify(await visible()) === '["second","third"]', 'Apply hides a matching category');
  assert((await saved()).categories.items[0].value === 'Adults', 'Apply persists settings');

  await open(); await section('Categories');
  await ui.getByLabel('Enable category 1', { exact: true }).uncheck();
  await apply();
  assert(JSON.stringify(await visible()) === '["first","second","third"]', 'Disabling an item restores entries in order');
  await open(); await section('Categories');
  await ui.getByLabel('Enable category 1', { exact: true }).check();
  await ui.getByLabel('Enable categories filter', { exact: true }).uncheck();
  await apply();
  assert((await visible()).length === 3 && (await saved()).categories.items[0].enabled, 'Group switch preserves item state');

  for (const action of ['cancel', 'escape', 'outside']) {
    await open(); await section('Categories');
    await ui.getByRole('textbox', { name: 'Category 1', exact: true }).fill('Discard me');
    if (action === 'cancel') await ui.getByRole('button', { name: 'Cancel', exact: true }).click();
    if (action === 'escape') await page.keyboard.press('Escape');
    if (action === 'outside') await page.getByRole('heading', { name: 'Audiobook listings', exact: true }).click();
    await open(); await section('Categories');
    assert(await ui.getByRole('textbox', { name: 'Category 1', exact: true }).inputValue() === 'Adults', `${action} discards unapplied edits`);
    await page.keyboard.press('Escape');
  }

  await open(); await section('Categories');
  await ui.getByRole('button', { name: '+ Add category', exact: true }).click();
  await apply();
  assert(await ui.getByText('Enter a value or remove this item.', { exact: true }).isVisible(), 'Blank list rows show inline errors');
  await ui.getByRole('textbox', { name: 'Category 2', exact: true }).fill(' adults ');
  await apply();
  assert(await ui.getByText('This value is already in the list.', { exact: true }).isVisible(), 'Duplicate rows show inline errors');
  await ui.getByRole('button', { name: 'Remove category 2', exact: true }).click();
  await section('Bitrate');
  await ui.getByLabel('Bitrate: Minimum (Kbps)', { exact: true }).fill('400');
  await apply();
  assert(await ui.getByText('The upper bound must be at least the lower bound.', { exact: true }).isVisible(), 'Reversed ranges show inline errors');
  await ui.getByRole('button', { name: 'Cancel', exact: true }).click();

  await open(); await section('Categories');
  await ui.getByLabel('Enable categories filter', { exact: true }).check();
  await page.evaluate(() => { fixture.failSave = true; });
  await apply();
  assert(await panel.isVisible() && (await visible()).length === 3, 'Save failure retains draft and existing filters');
  assert(await ui.getByRole('alert').isVisible(), 'Save failure announces an error');
  await page.evaluate(() => { fixture.failSave = false; });
  await apply();
  await page.reload();
  await gear.waitFor();
  assert(JSON.stringify(await visible()) === '["second","third"]', 'Reload restores saved filtering');

  await page.locator('body').click({ position: { x: 740, y: 20 } });
  await page.keyboard.press('ArrowDown');
  assert(await page.evaluate(() => fixture.scrolls.at(-1)) === 'third', 'Arrow navigation skips filtered entries');
  await page.getByRole('textbox', { name: 'Site search' }).focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.evaluate(() => fixture.clicks.length) === 0, 'Editable page controls retain arrow keys');
  await open(); await page.keyboard.press('ArrowRight');
  assert(await page.evaluate(() => fixture.clicks.length) === 0, 'Open settings suppress page navigation');
  await section('Languages');
  await ui.getByRole('button', { name: '+ Add language', exact: true }).click();
  await ui.getByRole('textbox', { name: 'Language 1', exact: true }).fill('Klingon');
  await ui.getByLabel('Enable languages filter', { exact: true }).check();
  await apply();
  const clicks = await page.evaluate(() => fixture.clicks);
  assert(clicks.length === 1 && clicks[0].target === '#next' && clicks[0].saved.abbnaSettings.languages.enabled, 'Empty-page skipping occurs after settings are saved');

  await page.goto(`${base}?no-pagination`);
  await gear.waitFor();
  assert(await ui.getByText('No entries match your filters.', { exact: true }).isVisible(), 'Missing next link leaves an actionable empty state');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowRight');
  await ui.getByRole('button', { name: 'Adjust settings', exact: true }).click();
  await section('Navigation');
  await ui.getByLabel('Skip pages with no matching entries', { exact: true }).uncheck();
  await apply();
  await page.goto(base); await gear.waitFor();
  assert(await page.evaluate(() => fixture.clicks.length) === 0, 'Disabled auto-skip keeps empty pages in place');

  await page.goto(`${base}?fail-load`); await gear.waitFor();
  assert((await visible()).length === 3, 'Storage read failure leaves listings unfiltered');
  await open();
  assert(await ui.getByText(/Saved settings could not be loaded/).isVisible(), 'Storage read failure is explained in settings');
  await page.keyboard.press('Escape');
  await page.goto(`${base}?empty`); await gear.waitFor();
  assert(await page.evaluate(() => fixture.clicks.length) === 0, 'Pages without listings do not auto-skip');

  await page.goto(base); await gear.waitFor();
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await open(); await section('Categories');
  await ui.getByRole('button', { name: '+ Add category', exact: true }).click();
  await ui.getByRole('textbox', { name: 'Category 1', exact: true }).fill('Historical Fiction');
  await page.setViewportSize({ width: 360, height: 640 });
  const bounds = await panel.boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 360 && bounds.y + bounds.height <= 640, 'Popover fits a narrow viewport');
  assert(await ui.getByRole('textbox', { name: 'Category 1', exact: true }).evaluate(node => getComputedStyle(node).width !== '600px'), 'Host input styling does not leak into settings');
  await ui.getByRole('button', { name: 'Apply', exact: true }).scrollIntoViewIfNeeded();
  assert(await ui.getByRole('button', { name: 'Apply', exact: true }).isVisible(), 'Apply remains reachable on narrow screens');
  await page.setViewportSize({ width: 1100, height: 850 });
  return results;
}
