export function getGridLayout(paneCount: number) {
  const columns = Math.ceil(Math.sqrt(paneCount));
  const rows = Math.ceil(paneCount / columns);
  return { columns, rows };
}

export function formatRelativeTime(iso?: string) {
  if (!iso) {
    return '-';
  }

  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) {
    return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)}m ago`;
  }
  return `${Math.floor(diff / 3_600_000)}h ago`;
}