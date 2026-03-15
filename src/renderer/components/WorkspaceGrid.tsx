import { PaneState } from '../../main/persistence';
import { getGridLayout } from '../utils/layout';
import { Pane } from './Pane';

interface WorkspaceGridProps {
  panes: PaneState[];
  activePaneId?: string;
  expandedPaneId?: string;
  paneObserverPreloadPath: string;
  compactOverlayEnabled: boolean;
  blinkEnabled: boolean;
  blinkCycles: number;
  onPaneFocus: (paneId: string) => void;
  onToggleExpanded: (paneId: string) => void;
  onUpdateGuide: (paneId: string, field: keyof PaneState['guide'], value: string) => void;
  onStatusUpdate: (paneId: string, updater: (pane: PaneState) => PaneState) => void;
}

export function WorkspaceGrid({
  panes,
  activePaneId,
  expandedPaneId,
  paneObserverPreloadPath,
  compactOverlayEnabled,
  blinkEnabled,
  blinkCycles,
  onPaneFocus,
  onToggleExpanded,
  onUpdateGuide,
  onStatusUpdate
}: WorkspaceGridProps) {
  const paneCount = panes.length;
  const { columns, rows } = getGridLayout(paneCount);

  return (
    <main
      className={`workspace-grid ${expandedPaneId ? 'expanded-mode' : ''}`}
      style={{
        gridTemplateColumns: expandedPaneId ? '1fr' : `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: expandedPaneId ? '1fr' : `repeat(${rows}, minmax(0, 1fr))`
      }}
    >
      {panes.map((pane) => (
        <Pane
          key={pane.id}
          pane={pane}
          activePaneId={activePaneId}
          expandedPaneId={expandedPaneId}
          paneObserverPreloadPath={paneObserverPreloadPath}
          compactOverlayEnabled={compactOverlayEnabled}
          blinkEnabled={blinkEnabled}
          blinkCycles={blinkCycles}
          onPaneFocus={onPaneFocus}
          onToggleExpanded={onToggleExpanded}
          onUpdateGuide={onUpdateGuide}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </main>
  );
}