import { PaneState } from '../../main/persistence';

interface ReadyQueueProps {
  panes: PaneState[];
  onOpenPane: (paneId: string) => void;
}

export function ReadyQueue({ panes, onOpenPane }: ReadyQueueProps) {
  if (!panes.length) {
    return null;
  }

  return (
    <aside className="ready-queue" aria-label="Completed unread queue">
      <div className="ready-queue-title">Ready Queue ({panes.length})</div>
      <div className="ready-queue-list">
        {panes.map((pane) => (
          <button key={pane.id} className="ready-queue-item" onClick={() => onOpenPane(pane.id)}>
            <span className="ready-queue-index">P{pane.index + 1}</span>
            <span className="ready-queue-name">{pane.guide.projectName || pane.title || 'Untitled'}</span>
            <span className="ready-queue-time">
              {pane.lastCompletedAt ? new Date(pane.lastCompletedAt).toLocaleTimeString() : 'just now'}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
