import { AppSettings } from '../../main/persistence';

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (next: Partial<AppSettings>) => void;
}

export function SettingsModal({ open, settings, onClose, onUpdate }: SettingsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <label>
          Default Pane Count
          <input
            type="number"
            min={1}
            max={9}
            value={settings.preferredPaneCount}
            onChange={(e) => onUpdate({ preferredPaneCount: Number(e.target.value) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.preferExternalMonitor}
            onChange={(e) => onUpdate({ preferExternalMonitor: e.target.checked })}
          />
          Prefer External Monitor
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(e) => onUpdate({ alwaysOnTop: e.target.checked })}
          />
          Always On Top
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.blinkEnabled}
            onChange={(e) => onUpdate({ blinkEnabled: e.target.checked })}
          />
          Blink On Completed Unread
        </label>
        <label>
          Blink Cycles
          <input
            type="number"
            min={1}
            max={5}
            value={settings.blinkCycles}
            onChange={(e) => onUpdate({ blinkCycles: Number(e.target.value) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.autoRestoreWorkspace}
            onChange={(e) => onUpdate({ autoRestoreWorkspace: e.target.checked })}
          />
          Auto Restore Workspace
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.compactOverlayEnabled}
            onChange={(e) => onUpdate({ compactOverlayEnabled: e.target.checked })}
          />
          Compact Overlay
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => onUpdate({ debugMode: e.target.checked })}
          />
          Debug Mode
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.telemetryOptIn}
            onChange={(e) => onUpdate({ telemetryOptIn: e.target.checked })}
          />
          Telemetry Opt-in (PostHog)
        </label>
        <label>
          PostHog Host
          <input
            value={settings.posthogHost}
            placeholder="https://us.i.posthog.com"
            onChange={(e) => onUpdate({ posthogHost: e.target.value })}
          />
        </label>
        <label>
          PostHog Project API Key
          <input
            type="password"
            value={settings.posthogProjectApiKey}
            placeholder="phc_..."
            onChange={(e) => onUpdate({ posthogProjectApiKey: e.target.value })}
          />
        </label>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}