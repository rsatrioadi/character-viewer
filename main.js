const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isQuitting = false;

// Check if there's already an instance running
if (!app.requestSingleInstanceLock()) {
	app.quit(); // Quit the second instance
} else {
	function createWindow() {
		// Get the display nearest to the cursor
		const cursorPosition = screen.getCursorScreenPoint();
		const display = screen.getDisplayNearestPoint(cursorPosition);
		const { width: screenWidth, height: screenHeight } = display.workAreaSize;

		const windowWidth = Math.floor(screenWidth / 4);
		const windowHeight = Math.floor(screenHeight / 2);

		mainWindow = new BrowserWindow({
			width: windowWidth,
			height: windowHeight,
			autoHideMenuBar: true,
			x: display.workArea.x + screenWidth - windowWidth - 5, // Place near right edge of the active display
			y: display.workArea.y + screenHeight - windowHeight - 5, // Place near bottom of the active display
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

		ipcMain.on('hide-window', () => {
			if (mainWindow.isVisible()) {
				mainWindow.hide(); // Hide the window
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

	// Handle the second instance (focus the existing window)
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		if (mainWindow) {
			if (!mainWindow.isVisible()) mainWindow.show();
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});

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
}
