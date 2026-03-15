import { PaneGuide } from '../../main/persistence';

interface GuidePanelProps {
  guide: PaneGuide;
  open: boolean;
  onFieldChange: (field: keyof PaneGuide, value: string) => void;
}

const fields: Array<{ key: keyof PaneGuide; label: string; multiLine?: boolean }> = [
  { key: 'projectName', label: 'Project' },
  { key: 'summary', label: 'Summary', multiLine: true },
  { key: 'currentStatus', label: 'Current Status' },
  { key: 'nextAction', label: 'Next Action' },
  { key: 'notes', label: 'Notes', multiLine: true }
];

export function GuidePanel({ guide, open, onFieldChange }: GuidePanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="guide-panel">
      {fields.map((field) => {
        const value = String(guide[field.key] ?? '');
        return (
          <label key={field.key} className="guide-field">
            <span>{field.label}</span>
            {field.multiLine ? (
              <textarea value={value} onChange={(e) => onFieldChange(field.key, e.target.value)} />
            ) : (
              <input value={value} onChange={(e) => onFieldChange(field.key, e.target.value)} />
            )}
          </label>
        );
      })}
      <div className="guide-updated">Updated: {new Date(guide.updatedAt).toLocaleString()}</div>
      <button disabled title="MVP에서는 수동 입력 우선">
        Auto Summary (TODO)
      </button>
    </aside>
  );
}