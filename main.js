const { app, BrowserWindow, screen, globalShortcut } = require('electron');
const path = require('path');

function createWindow() {
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.floor(screenWidth / 4);
	const windowHeight = Math.floor(screenHeight / 2);

	win = new BrowserWindow({
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
	win.setMenuBarVisibility(false);
	win.loadFile('index.html');

	// Register the global shortcut
	const ret = globalShortcut.register('Control+Alt+E', () => {
		toggleWindowVisibility();
	});

	if (!ret) {
		console.log('Registration failed');
	}

	// Intercept the close event to hide instead of closing
	win.on('close', (event) => {
		event.preventDefault(); // Prevent the window from closing
		win.hide(); // Hide the window instead
	});
}

function toggleWindowVisibility() {
	if (win.isVisible()) {
		win.hide(); // If it's already visible, hide it
	} else {
		win.show(); // Otherwise, show the window
		win.focus(); // Focus on the window
	}
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// Unregister the shortcut when the app quits
app.on('will-quit', () => {
	globalShortcut.unregisterAll();
});
