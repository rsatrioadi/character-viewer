const { app, BrowserWindow, screen, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let isQuitting = false;

function createWindow() {
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.floor(screenWidth / 4);
	const windowHeight = Math.floor(screenHeight / 2);

	mainWindow = new BrowserWindow({
		width: windowWidth,
		height: windowHeight,
		autoHideMenuBar: true,
		x: screenWidth - windowWidth - 10,
		y: screenHeight - windowHeight - 10,
		icon: path.join(__dirname, 'assets', 'icon.ico'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	mainWindow.setMenuBarVisibility(false);
	mainWindow.loadFile('index.html');

	// Show the window only when it’s ready to prevent a flicker
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	// Intercept the close event to hide instead of closing
	mainWindow.on('close', (event) => {
		if (!isQuitting) {
			event.preventDefault(); // Prevent the window from closing
			mainWindow.hide(); // Hide the window instead
		}
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	// Listen for Ctrl+Q inside the window to quit
	mainWindow.webContents.on('before-input-event', (event, input) => {
		if (input.key === 'q' && input.control) {
			isQuitting = true;
			app.quit(); // Quit the app when Ctrl+Q is pressed
		}
	});
}

function toggleWindowVisibility() {
	if (mainWindow.isVisible()) {
		if (mainWindow.isFocused()) {
			mainWindow.hide(); // If it's already visible and focused, hide it
		} else {
			mainWindow.focus();
		}
	} else {
		mainWindow.show(); // Otherwise, show the window
		mainWindow.focus();
	}
}

// Global shortcut registration
function registerShortcuts() {
	globalShortcut.register('Control+Alt+E', () => {
		toggleWindowVisibility();
	});
}

// Unregister shortcuts when the app quits
function unregisterShortcuts() {
	globalShortcut.unregisterAll();
}

app.once('ready', () => {
	createWindow();
	registerShortcuts();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		createWindow();
	}
});

app.on('will-quit', unregisterShortcuts);
