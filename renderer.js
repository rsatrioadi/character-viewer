const fs = require('fs');
const path = require('path');

const searchBar = document.getElementById('search-bar');
const characterGrid = document.getElementById('character-grid');
const tooltip = document.getElementById('tooltip');
const charLimit = 1024;

function loadUnicodeData() {
	const filePath = path.join(__dirname, 'data', 'UnicodeData.txt');
	const unicodeData = [];

	const fileContent = fs.readFileSync(filePath, 'utf-8');
	const lines = fileContent.split('\n');

	lines.forEach(line => {
		const fields = line.split(';');
		if (fields.length > 1) {
			const codePointHex = fields[0];
			const name = fields[1];
			const codePoint = parseInt(codePointHex, 16);
			const char = String.fromCodePoint(codePoint);

			// Join all name fields for easy searching
			const allNames = [name, ...fields.slice(3).filter(Boolean)].join(" / ");

			unicodeData.push({
				char,
				name,
				code: `U+${codePointHex}`,
				allNames
			});
		}
	});

	return unicodeData;
}

function displayCharacters(characters) {
	characterGrid.innerHTML = ''; // Clear previous results
	characters.forEach(character => {
		const charDiv = document.createElement('div');
		charDiv.classList.add('character');
		charDiv.textContent = character.char;

		charDiv.addEventListener('mouseenter', (event) => showTooltip(event, character));
		charDiv.addEventListener('mouseleave', hideTooltip);
		charDiv.addEventListener('click', () => copyToClipboard(character.char));

		characterGrid.appendChild(charDiv);
	});
}

function showTooltip(event, character) {
	tooltip.textContent = `${character.name} (${character.code})`;
	tooltip.style.visibility = 'visible';

	// Position the tooltip relative to the cursor
	const offset = 10; // Offset value to prevent tooltip overlap with cursor
	tooltip.style.left = `${event.pageX + offset}px`;
	tooltip.style.top = `${event.pageY + offset}px`;
}

function hideTooltip() {
	tooltip.style.visibility = 'hidden';
}

function copyToClipboard(char) {
	navigator.clipboard.writeText(char).then(() => {
		// TODO: UI feedback?
	});
}

function containsSublist(mainList, subList) {
	if (subList.length === 0) return true;

	for (let i = 0; i <= mainList.length - subList.length; i++) {
		let match = true;
		for (let j = 0; j < subList.length; j++) {
			if (mainList[i + j] !== subList[j]) {
				match = false;
				break;
			}
		}
		if (match) return true;
	}

	return false;
}

function filterUnicodeData(query, unicodeData) {
	const queryWords = query.toLowerCase().split(/\s+/); // Split query into words
	const exactMatch = [], partialMatch1 = [], partialMatch2 = [], looseMatch = [];

	unicodeData.forEach(character => {
		const namesLower = character.allNames.toLowerCase();
		const namesWords = namesLower.split(/\s+/);

		// Exact matches for full query
		if (containsSublist(namesWords, queryWords)) {
			exactMatch.push(character);
		}
		// Match by name containing the query
		else if (namesLower.includes(query)) {
			partialMatch1.push(character);
		}
		// Match all query words (in any order)
		else if (queryWords.every(word => namesWords.includes(word))) {
			partialMatch2.push(character);
		}
		// Fallback: Match individual words in the name
		else if (queryWords.every(word => namesLower.includes(word))) {
			looseMatch.push(character);
		}
	});

	// Return results with exact matches first, followed by partial matches
	return [...exactMatch, ...partialMatch1, ...partialMatch2, ...looseMatch];
}

searchBar.addEventListener('input', () => {
	const query = searchBar.value.toLowerCase().trim();
	const filteredCharacters = filterUnicodeData(query, unicodeData).slice(0, charLimit);
	displayCharacters(filteredCharacters);
});

// Load and display initial data
const unicodeData = loadUnicodeData();
displayCharacters(unicodeData.slice(0, charLimit));
