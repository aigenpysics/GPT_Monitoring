import { app } from 'electron';
import { getDisplaySnapshot } from './displayManager';
import { FeatureFlagService } from './featureFlagService';
import { clearIpcHandlers, registerIpcHandlers } from './ipc';
import { loadState, saveWorkspace } from './persistence';
import { TelemetryService } from './telemetry/telemetryService';
import { createMainWindow, getMainWindow } from './windowManager';

let telemetryServiceRef: TelemetryService | null = null;

app.whenReady().then(() => {
  const { settings, workspace } = loadState();
  const telemetryService = new TelemetryService(settings);
  telemetryServiceRef = telemetryService;
  const featureFlagService = new FeatureFlagService();

  const monitors = getDisplaySnapshot();
  telemetryService.setContext({
    workspaceId: workspace?.id,
    paneCountTotal: workspace?.paneCount,
    selectedMonitorId: workspace?.monitorId,
    monitorCount: monitors.length
  });

  const window = createMainWindow(settings, workspace);

  if (!window) {
    throw new Error('Failed to create main window');
  }

  registerIpcHandlers(window, {
    telemetryService,
    featureFlagService
  });

  telemetryService.captureImmediate({
    name: 'app launched',
    properties: {
      restored: Boolean(workspace)
    }
  });

  telemetryService.captureImmediate({
    name: workspace ? 'workspace restored' : 'workspace opened',
    properties: {
      pane_count_total: workspace?.paneCount ?? settings.preferredPaneCount
    }
  });

  window.on('close', () => {
    const { workspace: latestWorkspace } = loadState();
    if (latestWorkspace) {
      const [x, y] = window.getPosition();
      const [width, height] = window.getSize();
      latestWorkspace.windowBounds = { x, y, width, height };
      saveWorkspace(latestWorkspace);
    }
  });

  app.on('activate', () => {
    if (!getMainWindow()) {
      createMainWindow(settings, workspace);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  clearIpcHandlers();
  if (telemetryServiceRef) {
    void telemetryServiceRef.shutdown();
  }
});