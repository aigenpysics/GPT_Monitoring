const { ipcRenderer } = require('electron');

const selectors = {
  stopButtonSelectors: [
    'button[data-testid="stop-button"]',
    'button[aria-label*="Stop" i]',
    'button:has(svg[aria-label*="Stop" i])'
  ],
  assistantMessageSelectors: [
    '[data-message-author-role="assistant"] .markdown',
    '[data-message-author-role="assistant"]',
    'article .markdown'
  ],
  loginSelectors: [
    'button[data-testid="login-button"]',
    'a[href*="/auth/login"]',
    'input[type="password"]'
  ],
  titleSelectors: ['h1', 'main h2']
};

function post(event) {
  ipcRenderer.sendToHost('pane-observer', event);
}

function queryAny(document, selectorList) {
  for (const selector of selectorList) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

function queryAll(document, selectorList) {
  for (const selector of selectorList) {
    const items = Array.from(document.querySelectorAll(selector));
    if (items.length > 0) {
      return items;
    }
  }
  return [];
}

function isChatGptUrl(url) {
  return /chatgpt\.com|chat\.openai\.com/i.test(url);
}

function getTitle() {
  const element = queryAny(document, selectors.titleSelectors);
  return (element && element.textContent && element.textContent.trim()) || document.title || 'ChatGPT';
}

function isLoginRequired() {
  return Boolean(queryAny(document, selectors.loginSelectors));
}

function isGenerating() {
  return Boolean(queryAny(document, selectors.stopButtonSelectors));
}

function latestAssistantText() {
  const messages = queryAll(document, selectors.assistantMessageSelectors);
  if (!messages.length) {
    return '';
  }
  return (messages[messages.length - 1].textContent || '').trim();
}

function startObserver() {
  if (!isChatGptUrl(location.href)) {
    post({ type: 'status', status: 'unknown' });
    return;
  }

  let lastText = '';
  let stableTicks = 0;
  let completedTimeout = null;
  let tickQueued = false;

  const tick = () => {
    try {
      if (isLoginRequired()) {
        post({ type: 'status', status: 'login-required' });
        return;
      }

      post({ type: 'title', title: getTitle() });

      const generating = isGenerating();
      const latest = latestAssistantText();

      if (generating) {
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
      post({ type: 'error', error: error instanceof Error ? error.message : 'Unknown observer error' });
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
  window.addEventListener('DOMContentLoaded', startObserver, { once: true });
} else {
  startObserver();
}
