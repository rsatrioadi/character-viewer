const fs = require('fs');
const path = require('path');

const searchBar = document.getElementById('search-bar');
const characterGrid = document.getElementById('character-grid');
const tooltip = document.getElementById('tooltip');

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

			unicodeData.push({
				char,
				name,
				code: `U+${codePointHex}`
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
		charDiv.addEventListener('mouseenter', () => showTooltip(character));
		charDiv.addEventListener('mouseleave', hideTooltip);
		charDiv.addEventListener('click', () => copyToClipboard(character.char));
		characterGrid.appendChild(charDiv);
	});
}

function showTooltip(character) {
	tooltip.textContent = `${character.name} (${character.code})`;
	tooltip.style.visibility = 'visible';
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
displayCharacters(unicodeData);

searchBar.addEventListener('input', () => {
	const query = searchBar.value.toLowerCase();
	const filteredCharacters = unicodeData.filter(character =>
		character.name.toLowerCase().includes(query)
	);
	displayCharacters(filteredCharacters);
});
