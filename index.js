const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.floor(screenWidth / 3);
	const windowHeight = Math.floor(screenHeight / 2);

	const win = new BrowserWindow({
		width: windowWidth,
		height: windowHeight,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	win.loadFile('index.html');
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
