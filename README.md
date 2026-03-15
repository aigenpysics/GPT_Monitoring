# GPT Monitor Wall

Electron + React + TypeScript desktop app for monitoring multiple ChatGPT panes in one workspace.

## Core Features

- Multi-pane workspace (1~9 panes) with automatic grid layout
- External monitor-first window placement
- Per-pane webview with shared ChatGPT session (`persist:gpt-shared`)
- Pane status tracking:
   - `loading`, `unknown`, `generating`, `completed`, `completed-unread`, `login-required`, `error`
- Ready Queue for unread completed panes
- Pane Full mode (expanded view) with reduced layout gap
- Per-pane Guide Panel (`projectName`, `summary`, `currentStatus`, `nextAction`, `notes`)
- Local persistence (settings + workspace restore)
- Telemetry pipeline (opt-in):
   - local queue first
   - PostHog remote delivery when enabled
   - failure-safe fallback (app keeps running)
- Feature flag scaffold via PostHog:
   - `blinkEnabled`, `slowThresholdMs`, `stalledThresholdMs`

## Architecture

- `src/main`
   - window lifecycle, monitor selection, IPC registration
   - persistence (`electron-store`)
   - telemetry service + queue + event normalization
   - feature flag service
- `src/preload`
   - secure bridge APIs (`contextBridge`)
   - ChatGPT observer + site adapter abstraction
- `src/renderer`
   - React UI and Zustand workspace store
   - pane grid, ready queue, guide panel, settings modal

## Runtime Flow (Completion Signal)

1. Preload observer detects DOM state transition.
2. It emits `pane-observer` IPC message (`status` / `completed`).
3. Renderer `Pane` receives `ipc-message` from webview.
4. Store updates pane state.
5. If pane is not focused, state becomes `completed-unread` and appears in Ready Queue.
6. Clicking Ready Queue item focuses pane and clears unread.

## Performance Optimizations Applied

- Removed redundant renderer-to-main `setAlwaysOnTop` IPC call during autosave
- Reduced no-op pane state writes (status/title/error/heartbeat dedup)
- Throttled observer mutation-triggered ticks
- Lowered periodic observer tick frequency (less IPC traffic)
- Disabled BrowserWindow DevTools for release-safe runtime behavior

## Development

### Requirements

- Node.js LTS
- npm

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

## Configuration Notes

- ChatGPT selector definitions:
   - `src/preload/adapters/selectors.chatgpt.ts`
- Main preload bridge:
   - `src/preload/bridge.ts`
- Pane observer preload used by webview:
   - `src/preload/paneObserver.cjs`

## Privacy & Telemetry

- Telemetry is opt-in (`telemetryOptIn`)
- Remote capture is attempted only when PostHog config is enabled
- Event factory filters forbidden sensitive fields
- Delivery failure should not block UX

## GitHub Release Checklist

- Run `npm run typecheck`
- Run `npm run build`
- Verify app launch and pane creation (1, 4, 9 panes)
- Verify completion -> `completed-unread` -> Ready Queue -> mark read flow
- Verify telemetry off/on behavior in Settings
- Verify invalid PostHog key does not break app

## Current Limitations

- Auto Summary is TODO (Guide Panel stores manual data only)
- Observer heuristics are intentionally conservative (`unknown` fallback)
- ChatGPT DOM changes may require selector updates