export const chatGptSelectors = {
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