let previousPageButton = null;
let nextPageButton = null;

let entries = [];
let currentEntryIndex = null;

// Categories to filter out
let blocklist_categories = ["Gay", "LGBT", "Horror", "Romance", "Adults", "Sex Scenes", "Fantasy", "Crime", "Mystery", "Thriller", "Action", "Adventure", "Sci-Fi", "LitRPG", "Paranormal", "Western", "Supernatural"];
// Keywords to filter out
let blocklist_keywords = ["M/M", "Best Friend"];
// Authors to filter out
let blocklist_authors = [];

// Filters out any entries with a bitrate lower than this value
let filter_min_bitrate = 128;
// Filters out any entries with a bitrate higher than this value
let filter_max_bitrate = 320;
// If true, will not filter out any entries with an unknown bitrate
let filter_allow_unknown_bitrate = true;

// Filters out any entries with a file size lower than this value.
// 0 means no minimum size.
let filter_min_size = 10;
// Filters out any entries with a file size higher than this value.
// -1 means no maximum size.
let filter_max_size = 1000;
// If true, will not filter out any entries with an unknown file size
let filter_allow_unknown_size = true;

// Filters out any entries posted before this date.
// Should be set to the earliest date that most things were posted in order to avoid incorrect dates, which are usually spam.
let filter_earliest_date = "2024-01-01";
// Filters out any entries posted after this date.
// Should be set to the current date in order to avoid incorrect dates, which are usually spam.
let filter_latest_date = "2024-12-31";
// If true, will filter out entries based on date.
let filter_on_dates = false;

// Languages to allow, filters out anything else.
let allowlist_languages = ["English"]
// Formats to allow, filters out anything else.
let allowlist_formats = ["MP3", "M4B", "WEBM"]

// If true, will automatically go to the next page when there are no entries after running all filters.
let auto_next_page_when_no_entries = true;
// If true, will automatically go to the next page when on the last entry.
let auto_next_page_when_next_entry_on_last_entry = true;

function InitializeScript() {
	// Find Navigation Buttons to use instead of manually determiining previous/next page URLs.
	const navigationButtons = document.querySelectorAll('.wp-pagenavi>a');
	navigationButtons.forEach((button) => {
		switch (button.textContent) {
			// Find the correct buttons based on the text content.
			case '«':
				previousPageButton = button;
				break;
			case '»':
				nextPageButton = button;
				break;
		}
	});

	// Grab all entries
	const initialEntries = document.querySelectorAll('#content>.post');
	console.log(initialEntries);

	// Iterate through entries to pull out data
	initialEntries.forEach((iterating_entry, index) => {
		// Remove entry from DOM
		const title = iterating_entry.querySelector(':scope > .postTitle').textContent;
		// console.log(title);
		const postInfo = iterating_entry.querySelector(':scope > .postInfo').textContent;
		// console.log(postInfo);

		let shouldAddEntry = true;

		// Start filtering out entries based on filter criteria.
		// Check if the entry should be added based on the blocklist based on categories.
		blocklist_categories.forEach((category) => {
			if (postInfo.indexOf(category) !== -1) {
				// console.log("Filtering entry: " + title + " because it contains the category: " + category);
				shouldAddEntry = false;
			}
		});

		// Check if the entry should be added based on the blocklist based on keywords.
		blocklist_keywords.forEach((keywords) => {
			if (postInfo.indexOf(keywords) !== -1) {
				// console.log("Filtering entry: " + title + " because it contains the keyword: " + keywords);
				shouldAddEntry = false;
			}
		});


		// Get the author of the entry.
		const author = iterating_entry.querySelector(':scope > .postContent > .center > .center > a').textContent;
		// console.log("Author: " + author);

		// Filter out any authors that are in the blocklist.
		// blocklist_authors.forEach((author) => {
		// 	if (author === author) {
		// 		shouldAddEntry = false;
		// 	}
		// });

		// Get the language of the entry.
		const language = postInfo.slice(postInfo.indexOf("Language: ") + "Language: ".length, postInfo.indexOf("Keywords: "));
		// console.log("Language: " + language);

		// Filter out any entries that don't match the allowlist languages.
		// allowlist_languages.forEach((language) => {
		// 	if (language === language) {
		// 		shouldAddEntry = false;
		// 	}
		// });

		// Get the substring starting with "Language: " and ending with "Keywords: "

		// const categories = postInfo.slice(postInfo.indexOf("Category: ") + "Category: ".length, postInfo.indexOf("  Language: "))
		// 	.split(" ");
		// console.log("Categories: " + categories);
		// const keywords = postInfo.slice(postInfo.indexOf("Keywords: ") + "Keywords: ".length, -1)
		// 	.split(" ");;
		// console.log("Keywords: " + keywords);
		const postContent = iterating_entry.querySelector(':scope > .postContent > p:last-child').textContent;
		const postedDate = postContent.slice(postContent.indexOf("Posted: ") + "Posted: ".length, postContent.indexOf("Format: "));
		// console.log("Posted Date: " + postedDate)
		const format = postContent.slice(postContent.indexOf("Format: ") + "Format: ".length, postContent.indexOf(" / "));
		// console.log("Format: " + format);
		const bitrate = postContent.slice(postContent.indexOf("Bitrate: ") + "Bitrate: ".length, postContent.indexOf(" Kbps"));
		// console.log("Bitrate: " + bitrate);
		const size = postContent.slice(postContent.indexOf("File Size: ") + "File Size: ".length, -1);
		// console.log("Size: " + size);
		const detailsPage = iterating_entry.querySelector(':scope > .postMeta > .postLink > a').href;
		// console.log("Details Page: " + detailsPage);


		// If everything passed the filters, add the entry.
		if (shouldAddEntry) {
			// console.log("Adding entry: " + title + " because it passed all filters.");
			entries.push(iterating_entry);
		}
		else {
			// console.log("Removing entry: " + title + " because it failed a filter.");
			iterating_entry.remove();
		}
	});

	// console.log("Initial Entries Count: " + initialEntries.length);
	// console.log("Entries Length: " + entries.length);
	if (entries.length > 0) {
		currentEntryIndex = 0;
	}
	else if (auto_next_page_when_no_entries) {
		GotoNextPage();
	}

	// Register for key presses
	document.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowUp') {
			event.preventDefault(); // Prevent scrolling the page when using the arrow keys
			GotoPreviousEntry();
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault(); // Prevent scrolling the page when using the arrow keys
			GotoNextEntry();
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault(); // Prevent scrolling the page when using the arrow keys
			GotoPreviousPage();
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault(); // Prevent scrolling the page when using the arrow keys
			GotoNextPage();
		}
	});
}

// These functions are broken out in case we want to call them from outside the keydown event listener.

function GotoPreviousEntry() {
	if (--currentEntryIndex < 0) {
		currentEntryIndex = 0
		if (auto_next_page_when_no_entries) {
			GotoPreviousPage();
		}
	}
	console.log(currentEntryIndex);
	entries[currentEntryIndex].scrollIntoView();
}

function GotoNextEntry() {
	if (++currentEntryIndex >= entries.length) {
		currentEntryIndex = entries.length - 1;
		if (auto_next_page_when_next_entry_on_last_entry) {
			GotoNextPage();
		}
	}
	console.log(currentEntryIndex);
	entries[currentEntryIndex].scrollIntoView();
}

function GotoPreviousPage() {
	previousPageButton.click()
}

function GotoNextPage() {
	nextPageButton.click()
}

InitializeScript();
