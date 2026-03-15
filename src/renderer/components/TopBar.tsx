import { AppSettings, Workspace } from '../../main/persistence';

interface TopBarProps {
  workspace: Workspace;
  settings: AppSettings;
  monitorId: string;
  onPaneCountChange: (value: number) => void;
  onNewWorkspace: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  workspace,
  settings,
  monitorId,
  onPaneCountChange,
  onNewWorkspace,
  onOpenSettings
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">GPT Monitor Wall</div>
      <div className="topbar-actions">
        <label>
          Pane
          <input
            type="number"
            min={1}
            max={9}
            value={workspace.paneCount}
            onChange={(e) => onPaneCountChange(Number(e.target.value))}
          />
        </label>
        <button onClick={onNewWorkspace}>New Workspace</button>
        <button onClick={onOpenSettings}>Settings</button>
      </div>
      <div className="monitor-pill">
        Monitor: {monitorId} | Always On Top: {settings.alwaysOnTop ? 'ON' : 'OFF'}
      </div>
    </header>
  );
}