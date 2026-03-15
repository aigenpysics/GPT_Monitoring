import { PaneState } from '../../main/persistence';
import { formatRelativeTime } from '../utils/layout';

interface PaneHeaderProps {
  pane: PaneState;
  isExpanded: boolean;
  onRefresh: () => void;
  onOpenUrl: () => void;
  onToggleExpanded: () => void;
  onToggleGuide: () => void;
}

export function PaneHeader({
  pane,
  isExpanded,
  onRefresh,
  onOpenUrl,
  onToggleExpanded,
  onToggleGuide
}: PaneHeaderProps) {
  return (
    <div className="pane-header">
      <div className="pane-title">
        {pane.guide.projectName || pane.title || `Pane ${pane.index + 1}`}
      </div>
      <div className={`status-badge status-${pane.status}`}>{pane.status}</div>
      <div className="pane-last-time">{formatRelativeTime(pane.lastCompletedAt)}</div>
      <div className="pane-controls">
        <button onClick={onOpenUrl}>URL</button>
        <button onClick={onRefresh}>Refresh</button>
        <button onClick={onToggleGuide}>Guide</button>
        <button onClick={onToggleExpanded}>{isExpanded ? 'Back' : 'Full'}</button>
      </div>
    </div>
  );
}