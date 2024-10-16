const fs = require('fs');
const path = require('path');

const searchBar = document.getElementById('search-bar');
const characterGrid = document.getElementById('character-grid');
const tooltip = document.getElementById('tooltip');
const charLimit = 1024;

let selectedCharIndex = -1; // Tracks the current selected character index

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

			if (name !== "<control>") {
				const codePoint = parseInt(codePointHex, 16);
				const char = String.fromCodePoint(codePoint);

				// Join all name fields for easy searching
				const allNames = [char, name, codePointHex, ...fields.slice(3).filter(Boolean)].join(" / ");

				unicodeData.push({
					char,
					name,
					code: `U+${codePointHex}`,
					allNames
				});
			}
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

		charDiv.addEventListener('mouseenter', (event) => {
			clearHighlights();
			showTooltip(event, character);
		});
		charDiv.addEventListener('mouseleave', hideTooltip);
		charDiv.addEventListener('click', () => copyToClipboard(character.char));

		characterGrid.appendChild(charDiv);
	});
}

function clearHighlights() {
	const characters = Array.from(characterGrid.children);
	characters.forEach(charDiv => charDiv.classList.remove('selected'));
	hideTooltip();
}

function highlightCharacter(index) {
	const characters = Array.from(characterGrid.children);

	if (index >= 0 && index < characters.length) {
		// Add 'selected' class to the new character
		const target = characters[index];
		target.classList.add('selected');
		target.scrollIntoView({ block: "nearest" }); // Auto-scroll to keep it in view
		const character = unicodeData.find( datum => datum.char === target.textContent );
		showTooltip({ target }, character);
	}
}

function navigateGrid(key) {
	const characters = Array.from(characterGrid.children);
	const computedStyle = getComputedStyle(characterGrid);
	const gap = parseFloat(computedStyle.gap);
	const numCols = Math.floor((characterGrid.clientWidth+gap) / (characters[0].offsetWidth+gap)); // Columns in grid

	if (key === 'ArrowDown') {
		selectedCharIndex += numCols; // Move down one row
	} else if (key === 'ArrowUp') {
		selectedCharIndex -= numCols; // Move up one row
	} else if (key === 'ArrowRight') {
		selectedCharIndex += 1; // Move right one character
	} else if (key === 'ArrowLeft') {
		selectedCharIndex -= 1; // Move left one character
	}

	clearHighlights();
	// Prevent out-of-bounds navigation
	if (selectedCharIndex < 0) {
		selectedCharIndex = -1;
		searchBar.focus();
		searchBar.select();
	} else {
		if (selectedCharIndex >= characters.length) selectedCharIndex = characters.length - 1;
		highlightCharacter(selectedCharIndex); // Highlight the new character
	}
}

function copySelectedCharacter() {
	if (selectedCharIndex >= 0) {
		const characters = Array.from(characterGrid.children);
		const char = characters[selectedCharIndex].textContent;
		copyToClipboard(char);
	}
}

function showTooltip(event, character) {
	tooltip.textContent = `${character.name} (${character.code})`;
	tooltip.style.visibility = 'visible';

	// Get the tooltip dimensions
	const tooltipRect = tooltip.getBoundingClientRect();
	const pageWidth = window.innerWidth;
	const pageHeight = window.innerHeight;

	// Get the dimensions and position of the grid cell (the target element)
	const targetRect = event.target.getBoundingClientRect();

	// Set default tooltip position right below the grid cell
	let tooltipX = targetRect.left;
	let tooltipY = targetRect.bottom;

	// If the tooltip goes beyond the right edge of the page, adjust it to the left
	if (tooltipX + tooltipRect.width > pageWidth) {
		tooltipX = pageWidth - tooltipRect.width - 5;
	}

	// If the tooltip goes beyond the bottom edge of the page, adjust it to be above the grid cell
	if (tooltipY + tooltipRect.height > pageHeight) {
		tooltipY = targetRect.top - tooltipRect.height;
	}

	// Apply the calculated position
	tooltip.style.left = `${tooltipX}px`;
	tooltip.style.top = `${tooltipY}px`;
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

	let totalMatches = 0, i = 0;

	while (i < unicodeData.length && totalMatches < charLimit) {
		const character = unicodeData[i];
		const namesLower = character.allNames.toLowerCase();
		const namesWords = namesLower.split(/\s+/);

		if (containsSublist(namesWords, queryWords)) {
			exactMatch.push(character);
		}
		else if (namesLower.includes(query)) {
			partialMatch1.push(character);
		}
		else if (queryWords.every(word => namesWords.includes(word))) {
			partialMatch2.push(character);
		}
		else if (queryWords.every(word => namesLower.includes(word))) {
			looseMatch.push(character);
		}

		totalMatches = exactMatch.length + partialMatch1.length + partialMatch2.length + looseMatch.length;
		i++;
	}

	// Return results with exact matches first, followed by partial matches
	return [...exactMatch, ...partialMatch1, ...partialMatch2, ...looseMatch];
}

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		// Focus on the search bar and select the text inside the search bar
		selectedCharIndex = -1;
		clearHighlights();
		searchBar.focus();
		searchBar.select();
	} else if (event.key === 'ArrowDown' && document.activeElement === searchBar) {
		// Move focus from search bar to grid and select the first character
		selectedCharIndex = 0;
		highlightCharacter(selectedCharIndex);
		searchBar.blur();
	} else if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key) && document.activeElement !== searchBar) {
		// Handle grid navigation with arrow keys
		navigateGrid(event.key);
	} else if (event.key === 'Enter' && selectedCharIndex >= 0) {
		// Copy selected character when Enter is pressed
		copySelectedCharacter();
	}
});


searchBar.addEventListener('input', () => {
	const query = searchBar.value.toLowerCase().trim();
	const filteredCharacters = filterUnicodeData(query, unicodeData).slice(0, charLimit);
	displayCharacters(filteredCharacters);
});

// Load and display initial data
const unicodeData = loadUnicodeData();
displayCharacters(unicodeData.slice(0, charLimit));
searchBar.focus();
