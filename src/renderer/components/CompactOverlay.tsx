interface CompactOverlayProps {
  projectName: string;
  nextAction: string;
}

export function CompactOverlay({ projectName, nextAction }: CompactOverlayProps) {
  return (
    <div className="compact-overlay">
      <div>{projectName || 'Untitled Project'}</div>
      <div>{nextAction || 'Set next action'}</div>
    </div>
  );
}