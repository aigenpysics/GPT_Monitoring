import { useEffect, useRef, useState } from 'react';
import { PaneState } from '../../main/persistence';
import { CompactOverlay } from './CompactOverlay';
import { GuidePanel } from './GuidePanel';
import { PaneHeader } from './PaneHeader';

interface PaneProps {
  pane: PaneState;
  activePaneId?: string;
  expandedPaneId?: string;
  paneObserverPreloadPath: string;
  compactOverlayEnabled: boolean;
  blinkEnabled: boolean;
  blinkCycles: number;
  onPaneFocus: (paneId: string) => void;
  onToggleExpanded: (paneId: string) => void;
  onDeletePane: (paneId: string) => void;
  onUpdateGuide: (paneId: string, field: keyof PaneState['guide'], value: string) => void;
  onStatusUpdate: (paneId: string, updater: (pane: PaneState) => PaneState) => void;
}

type WebViewElement = HTMLElement & {
  reload: () => void;
  addEventListener: (name: string, listener: (event: any) => void) => void;
  removeEventListener: (name: string, listener: (event: any) => void) => void;
};

export function Pane({
  pane,
  activePaneId,
  expandedPaneId,
  paneObserverPreloadPath,
  compactOverlayEnabled,
  blinkEnabled,
  blinkCycles,
  onPaneFocus,
  onToggleExpanded,
  onDeletePane,
  onUpdateGuide,
  onStatusUpdate
}: PaneProps) {
  const webviewRef = useRef<WebViewElement | null>(null);
  const lastHeartbeatRef = useRef(0);
  const [guideOpen, setGuideOpen] = useState(true);

  const isExpanded = expandedPaneId === pane.id;
  const hiddenByOtherExpanded = expandedPaneId && !isExpanded;
  const isCompact = compactOverlayEnabled && !isExpanded;

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const onStart = () => {
      onStatusUpdate(pane.id, (prev) => (prev.status === 'loading' ? prev : { ...prev, status: 'loading' }));
    };

    const onStop = () => {
      onStatusUpdate(pane.id, (prev) => (prev.status === 'loading' ? { ...prev, status: 'idle' } : prev));
    };

    const onMessage = (event: any) => {
      if (event.channel !== 'pane-observer') {
        return;
      }
      const payload = event.args?.[0];
      if (!payload) {
        return;
      }

      if (payload.type === 'title') {
        onStatusUpdate(pane.id, (prev) => {
          const nextTitle = payload.title || prev.title;
          return nextTitle === prev.title ? prev : { ...prev, title: nextTitle };
        });
        return;
      }

      if (payload.type === 'status') {
        const mapped = payload.status as PaneState['status'];
        onStatusUpdate(pane.id, (prev) => (prev.status === mapped ? prev : { ...prev, status: mapped }));
        return;
      }

      if (payload.type === 'completed') {
        onStatusUpdate(pane.id, (prev) => {
          const isActive = activePaneId === pane.id;
          const hasWorkContext = Boolean(
            prev.guide.projectName.trim() ||
              prev.guide.nextAction.trim() ||
              prev.guide.summary.trim() ||
              prev.guide.currentStatus.trim() ||
              prev.guide.notes.trim()
          );
          const shouldUnread = !isActive && hasWorkContext;
          const nextStatus = shouldUnread ? 'completed-unread' : 'completed';
          const nextUnread = shouldUnread;
          if (prev.status === nextStatus && prev.unread === nextUnread) {
            return prev;
          }
          return {
            ...prev,
            status: nextStatus,
            unread: nextUnread,
            lastCompletedAt: new Date().toISOString()
          };
        });
      }

      if (payload.type === 'heartbeat') {
        const current = Date.parse(String(payload.at ?? '')) || Date.now();
        if (current - lastHeartbeatRef.current < 5000) {
          return;
        }
        lastHeartbeatRef.current = current;
        onStatusUpdate(pane.id, (prev) => {
          if (prev.diagnostics?.lastHeartbeatAt === payload.at) {
            return prev;
          }
          return {
            ...prev,
            diagnostics: {
              ...prev.diagnostics,
              lastHeartbeatAt: payload.at
            }
          };
        });
      }

      if (payload.type === 'error') {
        onStatusUpdate(pane.id, (prev) => {
          if (prev.status === 'error' && prev.diagnostics?.lastError === payload.error) {
            return prev;
          }
          return {
            ...prev,
            status: 'error',
            diagnostics: {
              ...prev.diagnostics,
              lastError: payload.error
            }
          };
        });
      }
    };

    webview.addEventListener('did-start-loading', onStart);
    webview.addEventListener('did-stop-loading', onStop);
    webview.addEventListener('ipc-message', onMessage);

    return () => {
      webview.removeEventListener('did-start-loading', onStart);
      webview.removeEventListener('did-stop-loading', onStop);
      webview.removeEventListener('ipc-message', onMessage);
    };
  }, [activePaneId, onStatusUpdate, pane.id]);

  const onRefresh = () => {
    webviewRef.current?.reload();
  };

  const onOpenUrl = () => {
    const next = window.prompt('Enter URL', pane.url);
    if (!next) {
      return;
    }
    onStatusUpdate(pane.id, (prev) => ({ ...prev, url: next }));
  };

  return (
    <section
      className={`pane ${hiddenByOtherExpanded ? 'hidden' : ''} ${
        pane.status === 'completed-unread' && blinkEnabled ? 'blink' : ''
      }`}
      style={{ ['--blink-cycles' as string]: String(blinkCycles) }}
      onMouseDown={() => onPaneFocus(pane.id)}
    >
      <PaneHeader
        pane={pane}
        isExpanded={isExpanded}
        onRefresh={onRefresh}
        onOpenUrl={onOpenUrl}
        onToggleExpanded={() => onToggleExpanded(pane.id)}
        onToggleGuide={() => setGuideOpen((prev) => !prev)}
        onDeletePane={() => onDeletePane(pane.id)}
      />

      <div className="pane-body">
        <webview
          ref={(node) => {
            webviewRef.current = node as WebViewElement;
          }}
          src={pane.url}
          preload={paneObserverPreloadPath}
          partition="persist:gpt-shared"
          allowpopups={false}
          className="pane-webview"
        />

        <GuidePanel
          guide={pane.guide}
          open={guideOpen && !isCompact}
          onFieldChange={(field, value) => onUpdateGuide(pane.id, field, value)}
        />
      </div>

      {isCompact && (
        <CompactOverlay
          projectName={pane.guide.projectName}
          nextAction={pane.guide.nextAction}
        />
      )}
    </section>
  );
}