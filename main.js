const { app, BrowserWindow, protocol, shell } = require('electron');
const path = require('path');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Load the React app
if (process.env.NODE_ENV === 'development') {
  mainWindow.loadURL('http://localhost:3000');
} else {
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
}
mainWindow.webContents.openDevTools();
};

// Handle `msal://auth` redirects
app.setAsDefaultProtocolClient('msal');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Auth handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('Received auth callback:', url);
  // Pass code back to MSAL here (see earlier messages)
});
