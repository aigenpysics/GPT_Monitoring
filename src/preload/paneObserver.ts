import { ipcRenderer } from 'electron';
import { chatGptAdapter } from './adapters/chatgptAdapter';
import { SiteAdapter } from './adapters/siteAdapter';

type OutboundEvent =
  | { type: 'status'; status: string }
  | { type: 'title'; title: string }
  | { type: 'completed' }
  | { type: 'heartbeat'; at: string }
  | { type: 'error'; error: string };

const adapters: SiteAdapter[] = [chatGptAdapter];

function post(event: OutboundEvent) {
  ipcRenderer.sendToHost('pane-observer', event);
}

function resolveAdapter(url: string): SiteAdapter | null {
  return adapters.find((adapter) => adapter.match(url)) ?? null;
}

function start() {
  let lastText = '';
  let stableTicks = 0;
  let completedTimeout: ReturnType<typeof setTimeout> | null = null;
  let tickQueued = false;

  const adapter = resolveAdapter(location.href);
  if (!adapter) {
    post({ type: 'status', status: 'unknown' });
    return;
  }

  const tick = () => {
    try {
      if (adapter.isLoginRequired(document)) {
        post({ type: 'status', status: 'login-required' });
        return;
      }

      const title = adapter.getTitle(document);
      if (title) {
        post({ type: 'title', title });
      }

      const isGenerating = adapter.isGenerating(document);
      const latest = adapter.getLatestAssistantMessageText(document);

      if (isGenerating) {
        stableTicks = 0;
        lastText = latest;
        if (completedTimeout) {
          clearTimeout(completedTimeout);
          completedTimeout = null;
        }
        post({ type: 'status', status: 'generating' });
      } else {
        if (latest === lastText) {
          stableTicks += 1;
        } else {
          stableTicks = 0;
          lastText = latest;
        }

        if (stableTicks >= 3) {
          post({ type: 'status', status: 'completed' });
          if (!completedTimeout) {
            completedTimeout = setTimeout(() => {
              post({ type: 'completed' });
              completedTimeout = null;
            }, 1500);
          }
        } else {
          post({ type: 'status', status: 'unknown' });
        }
      }

      post({ type: 'heartbeat', at: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown observer error';
      post({ type: 'error', error: message });
    }
  };

  const observer = new MutationObserver(() => {
    if (tickQueued) {
      return;
    }
    tickQueued = true;
    setTimeout(() => {
      tickQueued = false;
      tick();
    }, 150);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setInterval(tick, 1000);
  tick();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}