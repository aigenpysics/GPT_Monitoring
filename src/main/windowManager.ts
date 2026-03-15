import { app, BrowserWindow, Rectangle } from 'electron';
import path from 'node:path';
import { pickDisplay } from './displayManager';
import { AppSettings, Workspace } from './persistence';

let mainWindow: BrowserWindow | null = null;

function getPreloadPath() {
  return path.join(app.getAppPath(), 'src/preload/bridge.cjs');
}

export function getPaneObserverPreloadPath() {
  return path.join(app.getAppPath(), 'src/preload/paneObserver.cjs');
}

function computeInitialBounds(
  settings: AppSettings,
  workspace: Workspace | null
): Rectangle {
  const display = pickDisplay(settings.preferExternalMonitor);
  const savedBounds = workspace?.windowBounds;

  if (savedBounds) {
    return savedBounds;
  }

  const margin = 60;
  return {
    x: display.bounds.x + margin,
    y: display.bounds.y + margin,
    width: Math.max(1200, Math.floor(display.workArea.width * 0.85)),
    height: Math.max(800, Math.floor(display.workArea.height * 0.85))
  };
}

export function createMainWindow(settings: AppSettings, workspace: Workspace | null) {
  const bounds = computeInitialBounds(settings, workspace);

  mainWindow = new BrowserWindow({
    ...bounds,
    title: 'GPT Monitor Wall',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      devTools: false,
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(settings.alwaysOnTop);

  if (!mainWindow) {
    return;
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[window] did-finish-load', mainWindow?.webContents.getURL());
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[window] did-fail-load', { errorCode, errorDescription, validatedURL });
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('[renderer console]', { level, message, line, sourceId });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[window] render-process-gone', details);
  });

  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../../out/renderer/index.html'));
  }

  return mainWindow;
}

export function getMainWindow() {
  return mainWindow;
}