import { useEffect, useMemo, useRef, useState } from 'react';
import { PaneState } from '../main/persistence';
import { ReadyQueue } from './components/ReadyQueue';
import { hydrateStore, useWorkspaceStore } from './store/workspaceStore';
import { SettingsModal } from './components/SettingsModal';
import { TopBar } from './components/TopBar';
import { WorkspaceGrid } from './components/WorkspaceGrid';

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function App() {
  const [isReady, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startPromptOpen, setStartPromptOpen] = useState(true);
  const [startPaneCount, setStartPaneCount] = useState(4);

  const {
    settings,
    workspace,
    featureFlags,
    currentMonitorId,
    activePaneId,
    paneObserverPreloadPath,
    setFeatureFlags,
    setPaneCount,
    setExpandedPane,
    updatePane,
    updateGuideField,
    markPaneFocused,
    updateSettings,
    resetWorkspace
  } = useWorkspaceStore();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.electronAPI.bootstrap().then((bootstrap) => {
      hydrateStore(bootstrap);
      setStartPaneCount(bootstrap.workspace?.paneCount ?? bootstrap.settings.preferredPaneCount ?? 4);
      setReady(true);

      if (bootstrap.workspace?.id) {
        void window.electronAPI.refreshFeatureFlags(bootstrap.workspace.id).then((flags) => {
          setFeatureFlags(flags);
        });
      }
    });
  }, [setFeatureFlags]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      void window.electronAPI.updateSettings(settings);
      void window.electronAPI.updateWorkspace(workspace);
    }, 500);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [isReady, settings, workspace]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = activePaneId ?? workspace.panes[0]?.id;

      if (event.key === 'Escape') {
        setExpandedPane(undefined);
      }

      if (event.key === 'Enter' || event.key.toLowerCase() === 'f') {
        if (active) {
          setExpandedPane(workspace.expandedPaneId === active ? undefined : active);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault();
      }

      if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        const pane = workspace.panes[index];
        if (pane) {
          focusPane(pane.id);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePaneId, setExpandedPane, workspace]);

  const paneWarning = useMemo(() => workspace.paneCount >= 7, [workspace.paneCount]);
  const readyQueue = useMemo(
    () => workspace.panes.filter((pane) => pane.status === 'completed-unread' || pane.unread),
    [workspace.panes]
  );

  const captureEvent = (name: Parameters<typeof window.electronAPI.captureTelemetry>[0]['name'], properties?: Record<string, unknown>) => {
    if (!isReady) {
      return;
    }
    void window.electronAPI.captureTelemetry({ name, properties });
  };

  const focusPane = (paneId: string) => {
    const pane = workspace.panes.find((item) => item.id === paneId);
    if (!pane) {
      return;
    }

    if (pane.unread || pane.status === 'completed-unread') {
      captureEvent('pane marked read', {
        pane_id: pane.id,
        pane_index: pane.index
      });
    }

    markPaneFocused(paneId);
  };

  const handleStatusUpdate = (paneId: string, updater: (pane: PaneState) => PaneState) => {
    updatePane(paneId, (prev) => {
      const next = updater(prev);

      if (prev.status !== 'generating' && next.status === 'generating') {
        captureEvent('pane generating started', {
          pane_id: next.id,
          pane_index: next.index
        });
      }

      if (prev.status !== 'completed' && next.status === 'completed') {
        captureEvent('pane completed', {
          pane_id: next.id,
          pane_index: next.index
        });
      }

      if (prev.status !== 'completed-unread' && next.status === 'completed-unread') {
        captureEvent('pane completed', {
          pane_id: next.id,
          pane_index: next.index,
          unread: true
        });
      }

      return next;
    });
  };

  if (!isReady) {
    return <div className="loading-screen">Loading workspace...</div>;
  }

  const quickCounts = [1, 2, 4, 6, 9];

  const applyStartPaneCount = () => {
    captureEvent('workspace opened', {
      pane_count_total: startPaneCount
    });
    setPaneCount(startPaneCount);
    setStartPromptOpen(false);
  };

  return (
    <div className={`app-shell ${workspace.expandedPaneId ? 'full-mode' : ''}`}>
      <TopBar
        workspace={workspace}
        settings={settings}
        monitorId={currentMonitorId}
        onPaneCountChange={(value) => {
          const addedCount = Math.max(0, value - workspace.paneCount);
          setPaneCount(value);
          if (addedCount > 0) {
            captureEvent('pane created', { count: addedCount, pane_count_total: value });
          }
        }}
        onNewWorkspace={() => {
          captureEvent('workspace opened', {
            pane_count_total: settings.preferredPaneCount,
            reset: true
          });
          resetWorkspace(settings.preferredPaneCount);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {paneWarning && (
        <div className="warning-banner">
          Pane count is high. Performance may degrade on low-end machines.
        </div>
      )}

      <ReadyQueue
        panes={readyQueue}
        onOpenPane={(paneId) => {
          focusPane(paneId);
        }}
      />

      <WorkspaceGrid
        panes={workspace.panes}
        activePaneId={activePaneId}
        expandedPaneId={workspace.expandedPaneId}
        paneObserverPreloadPath={paneObserverPreloadPath}
        compactOverlayEnabled={settings.compactOverlayEnabled}
        blinkEnabled={settings.blinkEnabled && featureFlags.blinkEnabled}
        blinkCycles={settings.blinkCycles}
        onPaneFocus={focusPane}
        onToggleExpanded={(paneId) => {
          const next = workspace.expandedPaneId === paneId ? undefined : paneId;
          setExpandedPane(next);
          focusPane(paneId);
          captureEvent(next ? 'pane expanded' : 'pane collapsed', {
            pane_id: paneId
          });
        }}
        onUpdateGuide={(paneId, field, value) => {
          updateGuideField(paneId, field, value);
          if (typeof value === 'string') {
            const pane = workspace.panes.find((item) => item.id === paneId);
            captureEvent('guide updated', {
              pane_id: paneId,
              pane_index: pane?.index,
              field,
              value_length: value.length,
              project_name_hash: field === 'projectName' ? hashText(value) : undefined
            });
          }
        }}
        onStatusUpdate={handleStatusUpdate}
      />

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdate={(partial) => {
          updateSettings(partial);
          captureEvent('settings updated', {
            changed_keys: Object.keys(partial)
          });
        }}
      />

      {startPromptOpen && (
        <div className="startup-backdrop">
          <div className="startup-card">
            <h2>동시에 몇 개의 GPT 화면을 사용할까요?</h2>
            <p>1~9 사이 숫자를 입력하거나 빠른 선택 버튼을 누르세요.</p>
            <div className="startup-row">
              <input
                type="number"
                min={1}
                max={9}
                value={startPaneCount}
                onChange={(e) => setStartPaneCount(Math.max(1, Math.min(9, Number(e.target.value) || 1)))}
              />
              <button onClick={applyStartPaneCount}>워크스페이스 시작</button>
            </div>
            <div className="startup-quick-buttons">
              {quickCounts.map((count) => (
                <button key={count} onClick={() => setStartPaneCount(count)}>
                  {count}
                </button>
              ))}
            </div>
            <div className="startup-actions">
              <button onClick={() => setStartPromptOpen(false)}>마지막 워크스페이스 복원</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;