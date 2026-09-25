# AudioBookBay Navigation Assistant

Makes it easier to navigate AudioBookBay listings with configurable filters and arrow keys.

## Settings

Click the fixed gear in the top-left corner of any supported page. Expand a section to configure it, then choose **Apply** to save and update the current listing without a reload. **Cancel**, Escape, or clicking outside the settings dialog discards unapplied edits. While settings is open, the page is inert and keyboard focus stays inside the dialog; outside clicks close settings without activating page controls.

Settings are saved locally in Firefox's extension storage, shared across the supported AudioBookBay domains, and retained between browsing sessions. They are not synced between devices. If saving fails, your draft stays open and the existing filters remain applied.

New installations start with **all filters disabled and all lists empty**. Each filter has an independent enable checkbox. Categories, keywords, authors, languages, and formats also support individual item checkboxes, editing, and removal. Turning off a group preserves its items and their switches.

| Filter | Behavior |
| --- | --- |
| Categories | Exclude entries matching any enabled category exactly. |
| Keywords | Exclude entries containing any enabled phrase within keyword metadata. |
| Authors | Exclude entries matching any enabled author exactly. Listing authors are inferred from the final ` - Author` portion of the title, not the uploader. Ambiguous titles can limit accuracy. |
| Languages | Allow entries matching any enabled language. |
| Formats | Allow entries matching any enabled format, such as MP3 or M4B. |
| Bitrate | Inclusive minimum/maximum in Kbps, with an option to allow unknown values. |
| File size | Inclusive minimum/maximum in MB, with an option to allow unknown values. |
| Dates | Inclusive earliest/latest posting dates. Unknown or invalid listing dates are allowed. |

Category inputs offer native autocomplete suggestions from the current page’s sidebar, including age categories and category modifiers. Suggestions are sorted and deduplicated; you can still enter a custom category or type normally when the sidebar is unavailable.

Text matching ignores case and extra whitespace. An empty list, or a list with no enabled items, imposes no restriction. Missing text does not match exclusions, but fails an enabled, nonempty language or format allowlist. All enabled groups must pass for an entry to remain visible.

Blank range bounds mean no limit. The inactive presets are 128–320 Kbps and 10–1000 MB, with unknown values allowed; dates start blank. File sizes use decimal MB (1 MB = 1,000,000 bytes), with B/KB/MB/GB/TB and binary KiB/MiB/GiB/TiB converted before comparison. Blank or duplicate list items, negative/invalid numbers, and reversed ranges must be corrected before saving.

Filtered entries are hidden in place and restored in their original order when filters change. The settings header shows the number of enabled filter types and updates as you toggle groups. Individual list items and navigation options do not count as filter types. Collapsed enabled groups show compact summaries: enabled/total items for lists, ranges with units for bitrate and size, and short dates for date filters. Blank bounds show a one-sided limit or an unrestricted range.

## Navigation

- Up/Down moves between visible entries; Up at the first entry stays there.
- Left/Right moves between pages when a corresponding pagination link exists.
- **Skip pages with no matching entries**, enabled by default, automatically follows the next page when filters hide every listing. This also happens immediately after Apply, once settings have been saved. Consecutive pages without matches can therefore be skipped.
- **Go to the next page after the last entry**, enabled by default, follows the next page when Down is pressed on the last visible entry.
- When no entries match and skipping is disabled or no next page exists, an empty-state message offers access to settings.

Arrow shortcuts are inactive while the popover is open, inside editable/form controls, and on pages without listings. Missing metadata or pagination links are handled safely. Changing filters preserves the selected entry if it remains visible; otherwise, the first visible entry becomes selected.

## Development and verification

Load `manifest.json` as a temporary add-on using Firefox's `about:debugging`. The extension targets Firefox 125 or newer and uses a native modal dialog for settings. No build step or runtime dependency is needed.

Run the parser, matching, validation, and settings recovery tests with Node.js:

```sh
node --test tests/filters.test.cjs
```

For repeatable browser checks, serve the repository locally (for example, `python3 -m http.server 8765`) and open `http://localhost:8765/tests/fixtures/listings.html` in Firefox. This fixture includes malformed metadata, representative listing markup, deliberately conflicting host styles, and a mock storage API. It does not contact AudioBookBay or change extension settings.

Check list/group switches, Apply/Cancel/Escape/outside dismissal, restored entry order, narrow layouts, arrow-key behavior, and persistence after reload. In the fixture console, setting `fixture.failSave = true` simulates a storage failure; `fixture.clicks` records page navigation and the settings saved before it, while `fixture.scrolls` records entry navigation.

The repeatable browser assertions are in `tests/browser-checks.js`. With the fixture server running on port 8765 and Playwright CLI available, run:

```sh
playwright-cli -s=abbna open http://127.0.0.1:8765/tests/fixtures/listings.html --browser firefox
playwright-cli -s=abbna run-code "$(cat tests/browser-checks.js)"
playwright-cli -s=abbna close
```

https://addons.mozilla.org/en-US/firefox/addon/audiobookbay-navigation-assistant/

Please enter an issue if this extension stops working.

No plans on adding Chrome support.
