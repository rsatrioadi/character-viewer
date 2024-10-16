const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	const windowWidth = Math.floor(screenWidth / 4);
	const windowHeight = Math.floor(screenHeight / 2);

	const win = new BrowserWindow({
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
