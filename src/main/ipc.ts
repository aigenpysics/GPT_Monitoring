import { BrowserWindow, ipcMain } from 'electron';
import { FeatureFlagService } from './featureFlagService';
import { getDisplaySnapshot, pickDisplay } from './displayManager';
import {
  AppSettings,
  Workspace,
  loadState,
  saveSettings,
  saveWorkspace
} from './persistence';
import { TelemetryService } from './telemetry/telemetryService';
import { DomainEvent } from './telemetry/types';
import { getPaneObserverPreloadPath } from './windowManager';

interface IpcDependencies {
  telemetryService: TelemetryService;
  featureFlagService: FeatureFlagService;
}

export function registerIpcHandlers(window: BrowserWindow, deps: IpcDependencies) {
  let latestSettings = loadState().settings;

  ipcMain.handle('app:bootstrap', () => {
    const { settings, workspace } = loadState();
    const preferredDisplay = pickDisplay(settings.preferExternalMonitor);

    return {
      settings,
      workspace,
      monitors: getDisplaySnapshot(),
      currentMonitorId: String(preferredDisplay.id),
      paneObserverPreloadPath: getPaneObserverPreloadPath(),
      featureFlags: deps.featureFlagService.getSnapshot()
    };
  });

  ipcMain.handle('settings:update', (_event, nextSettings: AppSettings) => {
    const hadOptIn = latestSettings.telemetryOptIn;
    saveSettings(nextSettings);
    latestSettings = nextSettings;
    deps.telemetryService.updateSettings(nextSettings);

    deps.telemetryService.capture({
      name: 'settings updated',
      properties: {
        telemetry_opt_in: nextSettings.telemetryOptIn,
        always_on_top: nextSettings.alwaysOnTop,
        blink_enabled: nextSettings.blinkEnabled,
        pane_count_default: nextSettings.preferredPaneCount
      }
    });

    if (!hadOptIn && nextSettings.telemetryOptIn) {
      deps.telemetryService.captureImmediate({ name: 'telemetry opted in' });
    }

    if (hadOptIn && !nextSettings.telemetryOptIn) {
      deps.telemetryService.captureImmediate({ name: 'telemetry opted out' });
    }

    window.setAlwaysOnTop(nextSettings.alwaysOnTop);
    return { ok: true };
  });

  ipcMain.handle('workspace:update', (_event, nextWorkspace: Workspace | null) => {
    if (nextWorkspace && !window.isDestroyed()) {
      const [x, y] = window.getPosition();
      const [width, height] = window.getSize();
      nextWorkspace.windowBounds = { x, y, width, height };

      deps.telemetryService.setContext({
        workspaceId: nextWorkspace.id,
        paneCountTotal: nextWorkspace.paneCount,
        selectedMonitorId: nextWorkspace.monitorId
      });
    }
    saveWorkspace(nextWorkspace);
    return { ok: true };
  });

  ipcMain.handle('window:set-always-on-top', (_event, value: boolean) => {
    window.setAlwaysOnTop(value);
    return { ok: true };
  });

  ipcMain.handle('telemetry:capture', (_event, domainEvent: DomainEvent) => {
    deps.telemetryService.capture(domainEvent);
    return { ok: true };
  });

  ipcMain.handle('feature-flags:refresh', async (_event, distinctId: string) => {
    const settings = loadState().settings;
    try {
      const snapshot = await deps.featureFlagService.refresh(settings, distinctId);
      deps.telemetryService.capture({ name: 'feature flags refreshed' });
      return snapshot;
    } catch (error) {
      deps.telemetryService.capture({
        name: 'feature flags refresh failed',
        properties: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      return deps.featureFlagService.getSnapshot();
    }
  });
}

export function clearIpcHandlers() {
  const channels = [
    'app:bootstrap',
    'settings:update',
    'workspace:update',
    'window:set-always-on-top',
    'telemetry:capture',
    'feature-flags:refresh'
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}