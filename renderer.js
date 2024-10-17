const fs = require('fs');
const path = require('path');

const searchBar = document.getElementById('search-bar');
const characterGrid = document.getElementById('character-grid');
const tooltip = document.getElementById('tooltip');
const charLimit = 1024;

let selectedCharIndex = -1; // Tracks the current selected character index
let unicodeData = [];

// Load Unicode data asynchronously to avoid blocking the UI
function loadUnicodeData() {
	const filePath = path.join(__dirname, 'data', 'UnicodeData.txt');

	fs.readFile(filePath, 'utf-8', (err, fileContent) => {
		if (err) {
			console.error('Error loading Unicode data:', err);
			return;
		}

		unicodeData = parseUnicodeData(fileContent);
		displayCharacters(unicodeData.slice(0, charLimit)); // Display initial data
		searchBar.focus(); // Focus on the search bar initially
	});
}

// Parse the Unicode data file
function parseUnicodeData(fileContent) {
	const lines = fileContent.split('\n');
	const parsedData = [];

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

				parsedData.push({
					char,
					name,
					code: `U+${codePointHex}`,
					allNames
				});
			}
		}
	});

	return parsedData;
}

// Efficiently display characters in the grid
function displayCharacters(characters) {
	const fragment = document.createDocumentFragment(); // Use a fragment to batch DOM updates
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

		fragment.appendChild(charDiv);
	});

	characterGrid.appendChild(fragment); // Append all elements at once
}

// Highlights a character in the grid
function highlightCharacter(index) {
	const characters = Array.from(characterGrid.children);

	if (index >= 0 && index < characters.length) {
		clearHighlights(); // Clear previous highlights

		const target = characters[index];
		target.classList.add('selected');
		target.scrollIntoView({ block: "nearest" });

		const character = unicodeData.find(datum => datum.char === target.textContent);
		showTooltip({ target }, character); // Show tooltip for the selected character
	}
}

// Clears all highlights and hides the tooltip
function clearHighlights() {
	const characters = Array.from(characterGrid.children);
	characters.forEach(charDiv => charDiv.classList.remove('selected'));
	hideTooltip();
}

// Grid navigation logic
function navigateGrid(key) {
	const characters = Array.from(characterGrid.children);
	const computedStyle = getComputedStyle(characterGrid);
	const gap = parseFloat(computedStyle.gap);
	const numCols = Math.floor((characterGrid.clientWidth + gap) / (characters[0].offsetWidth + gap)); // Columns in grid

	switch (key) {
		case 'ArrowDown': selectedCharIndex += numCols; break;
		case 'ArrowUp': selectedCharIndex -= numCols; break;
		case 'ArrowRight': selectedCharIndex += 1; break;
		case 'ArrowLeft': selectedCharIndex -= 1; break;
	}

	selectedCharIndex = Math.max(-1, Math.min(selectedCharIndex, characters.length - 1));

	if (selectedCharIndex === -1) {
		searchBar.focus();
		searchBar.select();
	} else {
		highlightCharacter(selectedCharIndex);
	}
}

// Copy the selected character to the clipboard
function copyToClipboard(char) {
	navigator.clipboard.writeText(char).then(() => {
		// Optionally show feedback to the user
		console.log(`Copied to clipboard: ${char}`);
	}).catch(err => {
		console.error('Failed to copy text: ', err);
	});
}

// Tooltip logic
function showTooltip(event, character) {
	tooltip.textContent = `${character.name} (${character.code})`;
	tooltip.style.visibility = 'visible';

	const tooltipRect = tooltip.getBoundingClientRect();
	const pageWidth = window.innerWidth;
	const pageHeight = window.innerHeight;
	const targetRect = event.target.getBoundingClientRect();

	let tooltipX = targetRect.left;
	let tooltipY = targetRect.bottom;

	if (tooltipX + tooltipRect.width > pageWidth) {
		tooltipX = pageWidth - tooltipRect.width - 5;
	}

	if (tooltipY + tooltipRect.height > pageHeight) {
		tooltipY = targetRect.top - tooltipRect.height;
	}

	tooltip.style.left = `${tooltipX}px`;
	tooltip.style.top = `${tooltipY}px`;
}

function hideTooltip() {
	tooltip.style.visibility = 'hidden';
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

// Filters the Unicode data based on the search query
function filterUnicodeData(query, unicodeData) {
	const queryWords = query.toLowerCase().split(/\s+/); // Split query into words
	const exactMatch = [], partialMatch1 = [], partialMatch2 = [], looseMatch = [];
	
	let totalMatches = 0;

	for (let i = 0; i < unicodeData.length && totalMatches < charLimit; i++) {
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
	}

	// Return results with exact matches first, followed by partial matches
	return [...exactMatch, ...partialMatch1, ...partialMatch2, ...looseMatch];
}

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		selectedCharIndex = -1;
		clearHighlights();
		searchBar.focus();
		searchBar.select();
	} else if (event.key === 'ArrowDown' && document.activeElement === searchBar) {
		selectedCharIndex = 0;
		highlightCharacter(selectedCharIndex);
		searchBar.blur();
	} else if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key) && document.activeElement !== searchBar) {
		navigateGrid(event.key);
	} else if (event.key === 'Enter' && selectedCharIndex >= 0) {
		copySelectedCharacter();
	}
});

searchBar.addEventListener('input', () => {
	const query = searchBar.value.toLowerCase().trim();
	const filteredCharacters = filterUnicodeData(query, unicodeData).slice(0, charLimit);
	displayCharacters(filteredCharacters);
});

// Load Unicode data when the app starts
loadUnicodeData();
