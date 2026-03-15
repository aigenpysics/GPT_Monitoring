import { Display, screen } from 'electron';

export function pickDisplay(preferExternalMonitor: boolean): Display {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();

  if (!preferExternalMonitor || displays.length <= 1) {
    return primary;
  }

  const external = displays.find((display) => display.id !== primary.id);
  return external ?? primary;
}

export function getDisplaySnapshot() {
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  return displays.map((display) => ({
    id: String(display.id),
    isPrimary: display.id === primaryId,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor
  }));
}