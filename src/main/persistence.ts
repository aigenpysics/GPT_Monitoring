import Store from 'electron-store';

export type PaneStatus =
  | 'idle'
  | 'loading'
  | 'unknown'
  | 'generating'
  | 'completed'
  | 'completed-unread'
  | 'login-required'
  | 'error';

export interface AppSettings {
  preferredPaneCount: number;
  preferExternalMonitor: boolean;
  alwaysOnTop: boolean;
  blinkEnabled: boolean;
  blinkCycles: number;
  autoRestoreWorkspace: boolean;
  compactOverlayEnabled: boolean;
  debugMode: boolean;
  telemetryOptIn: boolean;
  posthogHost: string;
  posthogProjectApiKey: string;
}

export interface PaneGuide {
  projectName: string;
  summary: string;
  currentStatus: string;
  nextAction: string;
  notes: string;
  updatedAt: string;
  autoSummary?: string;
  manualOverride: boolean;
}

export interface PaneState {
  id: string;
  index: number;
  url: string;
  title: string;
  status: PaneStatus;
  lastCompletedAt?: string;
  unread: boolean;
  isExpanded: boolean;
  guide: PaneGuide;
  diagnostics?: {
    selectorVersion?: string;
    lastError?: string;
    lastHeartbeatAt?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  paneCount: number;
  monitorId?: string;
  windowBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
  panes: PaneState[];
  expandedPaneId?: string;
}

export interface PersistedState {
  settings: AppSettings;
  workspace: Workspace | null;
}

const defaults: PersistedState = {
  settings: {
    preferredPaneCount: 4,
    preferExternalMonitor: true,
    alwaysOnTop: false,
    blinkEnabled: true,
    blinkCycles: 3,
    autoRestoreWorkspace: true,
    compactOverlayEnabled: true,
    debugMode: false,
    telemetryOptIn: false,
    posthogHost: 'https://us.i.posthog.com',
    posthogProjectApiKey: ''
  },
  workspace: null
};

const store = new Store<PersistedState>({
  name: 'gpt-monitor-wall',
  defaults
});

export function loadState(): PersistedState {
  return {
    settings: store.get('settings', defaults.settings),
    workspace: store.get('workspace', null)
  };
}

export function saveSettings(settings: AppSettings): void {
  store.set('settings', settings);
}

export function saveWorkspace(workspace: Workspace | null): void {
  store.set('workspace', workspace);
}