import { AppSettings, PaneState, Workspace } from '../../main/persistence';

export interface AppBootstrap {
  settings: AppSettings;
  workspace: Workspace | null;
  featureFlags: {
    blinkEnabled: boolean;
    slowThresholdMs: number;
    stalledThresholdMs: number;
  };
  monitors: Array<{
    id: string;
    isPrimary: boolean;
    bounds: { x: number; y: number; width: number; height: number };
    scaleFactor: number;
  }>;
  currentMonitorId: string;
  paneObserverPreloadPath: string;
}

export interface WorkspaceViewState {
  settings: AppSettings;
  workspace: Workspace;
  featureFlags: {
    blinkEnabled: boolean;
    slowThresholdMs: number;
    stalledThresholdMs: number;
  };
  activePaneId?: string;
  paneObserverPreloadPath: string;
  currentMonitorId: string;
  setFeatureFlags: (flags: WorkspaceViewState['featureFlags']) => void;
  setPaneCount: (count: number) => void;
  setExpandedPane: (paneId?: string) => void;
  updatePane: (paneId: string, updater: (pane: PaneState) => PaneState) => void;
  updateGuideField: (
    paneId: string,
    field: keyof PaneState['guide'],
    value: string | boolean
  ) => void;
  markPaneFocused: (paneId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetWorkspace: (count: number) => void;
}