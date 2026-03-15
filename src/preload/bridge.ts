import { contextBridge, ipcRenderer } from 'electron';
import {
  AppSettings,
  Workspace
} from '../main/persistence';
import { DomainEvent } from '../main/telemetry/types';

const api = {
  bootstrap: () => ipcRenderer.invoke('app:bootstrap') as Promise<{
    settings: AppSettings;
    workspace: Workspace | null;
    monitors: Array<{
      id: string;
      isPrimary: boolean;
      bounds: { x: number; y: number; width: number; height: number };
      scaleFactor: number;
    }>;
    currentMonitorId: string;
    paneObserverPreloadPath: string;
    featureFlags: {
      blinkEnabled: boolean;
      slowThresholdMs: number;
      stalledThresholdMs: number;
    };
  }>,
  updateSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:update', settings),
  updateWorkspace: (workspace: Workspace | null) => ipcRenderer.invoke('workspace:update', workspace),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:set-always-on-top', value),
  captureTelemetry: (event: DomainEvent) => ipcRenderer.invoke('telemetry:capture', event),
  refreshFeatureFlags: (distinctId: string) =>
    ipcRenderer.invoke('feature-flags:refresh', distinctId) as Promise<{
      blinkEnabled: boolean;
      slowThresholdMs: number;
      stalledThresholdMs: number;
    }>
};

contextBridge.exposeInMainWorld('electronAPI', api);