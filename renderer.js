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
			const alternateNames = fields.slice(3).filter(name => name !== '');

			unicodeData.push({
				char,
				name,
				code: `U+${codePointHex}`,
				alternateNames
			});
		}
	});

	return unicodeData;
}

function displayCharacters(characters) {
	characterGrid.innerHTML = '';
	characters.forEach(character => {
		const charDiv = document.createElement('div');
		charDiv.classList.add('character');
		charDiv.textContent = character.char;
		charDiv.addEventListener('mouseenter', (event) => showTooltip(event,character));
		charDiv.addEventListener('mouseleave', hideTooltip);
		charDiv.addEventListener('click', () => copyToClipboard(character.char));
		characterGrid.appendChild(charDiv);
	});
}

function showTooltip(event, character) {
	tooltip.textContent = `${character.name} (${character.code})`;
	tooltip.style.visibility = 'visible';

	// Position the tooltip near the mouse cursor
	const tooltipX = event.pageX + 10;  // Offset by 10 pixels
	const tooltipY = event.pageY + 10;

	tooltip.style.left = `${tooltipX}px`;
	tooltip.style.top = `${tooltipY}px`;
}

function hideTooltip() {
	tooltip.style.visibility = 'hidden';
}

function copyToClipboard(char) {
	navigator.clipboard.writeText(char).then(() => {
		// alert(`Copied: ${char}`);
	});
}

const unicodeData = loadUnicodeData();
displayCharacters(unicodeData.slice(0, charLimit));

searchBar.addEventListener('input', () => {
	const query = searchBar.value.toLowerCase();
	const filteredCharactersFull = []; // List for full matches
	const filteredCharactersPartial = []; // List for partial matches

	const queryWords = query.split(/\s+/); // Split query into individual words

	for (const character of unicodeData) {
		const nameLower = character.name.toLowerCase();
		const alternateNamesLower = character.alternateNames.map(name => name.toLowerCase());

		// Check for exact matches
		if (nameLower.includes(query) || alternateNamesLower.includes(query)) {
			filteredCharactersFull.push(character);
		} else {
			// Check for partial matches (if all words in the query exist in the name or alternate names)
			const matchesInName = queryWords.every(word => nameLower.includes(word));
			const matchesInAlternates = alternateNamesLower.some(name => queryWords.every(word => name.includes(word)));

			if (matchesInName || matchesInAlternates) {
				filteredCharactersPartial.push(character);
			}
		}
	}

	// Merge the two lists: full matches first, then partial matches
	const filteredCharacters = [...filteredCharactersFull, ...filteredCharactersPartial];

	// Limit to first 100 results
	const limitedFilteredCharacters = filteredCharacters.slice(0, charLimit);

	displayCharacters(limitedFilteredCharacters); // Update display with limited results
});
