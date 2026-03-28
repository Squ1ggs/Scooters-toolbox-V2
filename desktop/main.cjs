const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const APP_ROOT = __dirname ? path.join(__dirname, '..') : process.cwd();
const START_PAGE = path.join(APP_ROOT, 'index.html');

function isExternalHttp(urlString) {
  return /^https?:\/\//i.test(urlString);
}

function isInternalHtml(urlString) {
  return /\.(html?)([#?].*)?$/i.test(urlString) || /^file:\/\//i.test(urlString);
}

function fileUrlFor(urlString, baseFilePath) {
  if (/^file:\/\//i.test(urlString)) return urlString;
  if (isExternalHttp(urlString)) return urlString;
  const baseDir = path.dirname(baseFilePath || START_PAGE);
  return 'file://' + path.resolve(baseDir, urlString).replace(/\\/g, '/');
}

function createWindow(targetFile = START_PAGE) {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    icon: path.join(APP_ROOT, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.removeMenu();
  win.loadFile(targetFile);

  win.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (isExternalHttp(url) && !url.startsWith('https://scooters-toolbox.netlify.app')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    if (isInternalHtml(url) || url.startsWith('https://scooters-toolbox.netlify.app')) {
      const child = createWindow(START_PAGE);
      if (url.startsWith('https://scooters-toolbox.netlify.app')) {
        child.loadURL(url);
      } else {
        child.loadURL(url);
      }
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const currentFile = win.webContents.getURL().startsWith('file://')
      ? decodeURIComponent(win.webContents.getURL().replace('file://', ''))
      : START_PAGE;

    if (isExternalHttp(url) && !url.startsWith('https://scooters-toolbox.netlify.app')) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }

    if (!isExternalHttp(url) && isInternalHtml(url)) {
      event.preventDefault();
      win.loadURL(fileUrlFor(url, currentFile));
    }
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
