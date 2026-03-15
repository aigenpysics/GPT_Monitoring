import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { PaneGuide, PaneState, Workspace } from '../../main/persistence';
import { getGridLayout } from '../utils/layout';
import { WorkspaceViewState } from '../types/models';

function defaultGuide(): PaneGuide {
  return {
    projectName: '',
    summary: '',
    currentStatus: '',
    nextAction: '',
    notes: '',
    updatedAt: new Date().toISOString(),
    manualOverride: false,
    autoSummary: ''
  };
}

function createPane(index: number): PaneState {
  return {
    id: uuid(),
    index,
    url: 'https://chatgpt.com/',
    title: 'ChatGPT',
    status: 'idle',
    unread: false,
    isExpanded: false,
    guide: defaultGuide()
  };
}

function createWorkspace(paneCount: number): Workspace {
  return {
    id: uuid(),
    name: 'Default Workspace',
    paneCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    panes: Array.from({ length: paneCount }, (_v, i) => createPane(i))
  };
}

function clampPaneCount(value: number) {
  return Math.max(1, Math.min(9, value));
}

export const useWorkspaceStore = create<WorkspaceViewState>((set) => ({
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
  workspace: createWorkspace(4),
  featureFlags: {
    blinkEnabled: true,
    slowThresholdMs: 20_000,
    stalledThresholdMs: 45_000
  },
  activePaneId: undefined,
  paneObserverPreloadPath: '',
  currentMonitorId: '',
  setFeatureFlags: (flags) => set(() => ({ featureFlags: flags })),
  setPaneCount: (count: number) =>
    set((state) => {
      const nextCount = clampPaneCount(count);
      const prev = state.workspace.panes;
      const nextPanes = Array.from({ length: nextCount }, (_v, i) => prev[i] ?? createPane(i)).map(
        (pane, i) => ({ ...pane, index: i })
      );

      return {
        workspace: {
          ...state.workspace,
          paneCount: nextCount,
          panes: nextPanes,
          updatedAt: new Date().toISOString()
        }
      };
    }),
  setExpandedPane: (paneId?: string) =>
    set((state) => ({
      workspace: {
        ...state.workspace,
        expandedPaneId: paneId,
        panes: state.workspace.panes.map((pane) => ({
          ...pane,
          isExpanded: paneId ? pane.id === paneId : false
        }))
      }
    })),
  updatePane: (paneId, updater) =>
    set((state) => ({
      workspace: {
        ...state.workspace,
        updatedAt: new Date().toISOString(),
        panes: state.workspace.panes.map((pane) => (pane.id === paneId ? updater(pane) : pane))
      }
    })),
  updateGuideField: (paneId, field, value) =>
    set((state) => ({
      workspace: {
        ...state.workspace,
        updatedAt: new Date().toISOString(),
        panes: state.workspace.panes.map((pane) => {
          if (pane.id !== paneId) {
            return pane;
          }
          return {
            ...pane,
            guide: {
              ...pane.guide,
              [field]: value,
              updatedAt: new Date().toISOString(),
              manualOverride: true
            }
          };
        })
      }
    })),
  markPaneFocused: (paneId) =>
    set((state) => ({
      activePaneId: paneId,
      workspace: {
        ...state.workspace,
        panes: state.workspace.panes.map((pane) => {
          if (pane.id !== paneId) {
            return pane;
          }
          const status = pane.status === 'completed-unread' ? 'completed' : pane.status;
          return { ...pane, unread: false, status };
        })
      }
    })),
  updateSettings: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...partial
      }
    })),
  resetWorkspace: (count: number) =>
    set(() => {
      const paneCount = clampPaneCount(count);
      const workspace = createWorkspace(paneCount);
      const { columns } = getGridLayout(paneCount);
      workspace.name = `Workspace ${paneCount} (${columns}col)`;
      return { workspace };
    })
}));

export function hydrateStore(bootstrap: {
  settings: WorkspaceViewState['settings'];
  workspace: Workspace | null;
  currentMonitorId: string;
  paneObserverPreloadPath: string;
  featureFlags: WorkspaceViewState['featureFlags'];
}) {
  useWorkspaceStore.setState((state) => ({
    ...state,
    settings: bootstrap.settings,
    workspace: bootstrap.workspace ?? createWorkspace(bootstrap.settings.preferredPaneCount),
    currentMonitorId: bootstrap.currentMonitorId,
    paneObserverPreloadPath: bootstrap.paneObserverPreloadPath,
    featureFlags: bootstrap.featureFlags
  }));
}