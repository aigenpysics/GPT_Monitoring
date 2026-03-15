const { contextBridge, ipcRenderer } = require('electron');

const api = {
  bootstrap: () => ipcRenderer.invoke('app:bootstrap'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  updateWorkspace: (workspace) => ipcRenderer.invoke('workspace:update', workspace),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('window:set-always-on-top', value),
  captureTelemetry: (event) => ipcRenderer.invoke('telemetry:capture', event),
  refreshFeatureFlags: (distinctId) => ipcRenderer.invoke('feature-flags:refresh', distinctId)
};

contextBridge.exposeInMainWorld('electronAPI', api);
