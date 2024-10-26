let previousPageButton = null;
let nextPageButton = null;

let entries = [];
let currentEntryIndex = null;

let blocklist_categories = []//["Gay", "LGBT", "Horror", "Romance", "Adults", "Sex Scenes"];
let blocklist_keywords = []//["M/M", "Best Friend"];
let blocklist_authors = [];

let filter_min_bitrate = 128;
let filter_max_bitrate = 320;
let filter_allow_unknown_bitrate = true;

let filter_min_size = 10;
let filter_max_size = 1000;
let filter_allow_unknown_size = true;

let filter_earliest_date = "2024-01-01";
let filter_latest_date = "2024-12-31";

let allowlist_languages = ["English"]
let allowlist_formats = ["MP3", "M4B", "WEBM"]

function InitializeScript() {
	console.log('Initializing script');

	// Handle Navigation Buttons
	const navigationButtons = document.querySelectorAll('.wp-pagenavi>a');

	navigationButtons.forEach((button) => {
		// console.log(button.textContent);

		switch (button.textContent) {
			// Handle Pages
			case '«':
				previousPageButton = button;
				break;
			case '»':
				nextPageButton = button;
				break;
		}
	});

	// Handle Entries
	const initialEntries = document.querySelectorAll('#content>.post');
	console.log(initialEntries);

	// Iterate through entries
	initialEntries.forEach((iterating_entry, index) => {
		// Remove entry from DOM
		const title = iterating_entry.querySelector(':scope > .postTitle').textContent;
		// console.log(title);
		const postInfo = iterating_entry.querySelector(':scope > .postInfo').textContent;
		// console.log(postInfo);

		let shouldAddEntry = true;

		blocklist_categories.forEach((category) => {
			if (postInfo.indexOf(category) !== -1) {
				// console.log("Filtering entry: " + title + " because it contains the category: " + category);
				shouldAddEntry = false;
			}
		});

		blocklist_keywords.forEach((keywords) => {
			if (postInfo.indexOf(keywords) !== -1) {
				// console.log("Filtering entry: " + title + " because it contains the keyword: " + keywords);
				shouldAddEntry = false;
			}
		});

		if (shouldAddEntry) {
			// console.log("Adding entry: " + title + " because it passed all filters.");
			entries.push(iterating_entry);
		}
		else {
			// console.log("Removing entry: " + title + " because it failed a filter.");
			iterating_entry.remove();
		}

		// Get the substring starting with "Language: " and ending with "Keywords: "
		// const language = postInfo.slice(postInfo.indexOf("Language: ") + "Language: ".length, postInfo.indexOf("Keywords: "));
		// console.log("Language: " + language);
		// const categories = postInfo.slice(postInfo.indexOf("Category: ") + "Category: ".length, postInfo.indexOf("  Language: "))
		// 	.split(" ");
		// console.log("Categories: " + categories);
		// const keywords = postInfo.slice(postInfo.indexOf("Keywords: ") + "Keywords: ".length, -1)
		// 	.split(" ");;
		// console.log("Keywords: " + keywords);
		// const author = iterating_entry.querySelector(':scope > .postContent > .center > .center > a').textContent;
		// console.log("Author: " + author);
		// const postContent = iterating_entry.querySelector(':scope > .postContent > p:last-child').textContent;
		// const postedDate = postContent.slice(postContent.indexOf("Posted: ") + "Posted: ".length, postContent.indexOf("Format: "));
		// console.log("Posted Date: " + postedDate)
		// const format = postContent.slice(postContent.indexOf("Format: ") + "Format: ".length, postContent.indexOf(" / "));
		// console.log("Format: " + format);
		// const bitrate = postContent.slice(postContent.indexOf("Bitrate: ") + "Bitrate: ".length, postContent.indexOf(" Kbps"));
		// console.log("Bitrate: " + bitrate);
		// const size = postContent.slice(postContent.indexOf("File Size: ") + "File Size: ".length, -1);
		// console.log("Size: " + size);
		// const detailsPage = iterating_entry.querySelector(':scope > .postMeta > .postLink > a').href;
		// console.log("Details Page: " + detailsPage);
	});

	// console.log("Initial Entries Count: " + initialEntries.length);
	// console.log("Entries Length: " + entries.length);
	if (entries.length > 0) {
		currentEntryIndex = 0;
	}

	// Handle Key Presses
	document.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowUp') {
			event.preventDefault(); // Prevent scrolling the page
			GotoPreviousEntry();
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault(); // Prevent scrolling the page
			GotoNextEntry();
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault(); // Prevent scrolling the page
			GotoPreviousPage();
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault(); // Prevent scrolling the page
			GotoNextPage();
		}
	});
}


function GotoPreviousEntry() {
	if (--currentEntryIndex < 0) {
		currentEntryIndex = 0
	}
	console.log(currentEntryIndex);
	entries[currentEntryIndex].scrollIntoView();
}

function GotoNextEntry() {
	if (++currentEntryIndex >= entries.length) {
		currentEntryIndex = entries.length - 1;
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
