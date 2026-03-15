import { chatGptSelectors } from './selectors.chatgpt';
import { SiteAdapter } from './siteAdapter';

function queryAny(document: Document, selectors: string[]): Element | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

function queryAll(document: Document, selectors: string[]): Element[] {
  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll(selector));
    if (matches.length > 0) {
      return matches;
    }
  }
  return [];
}

export const chatGptAdapter: SiteAdapter = {
  id: 'chatgpt',
  match(url: string) {
    return /chatgpt\.com|chat\.openai\.com/i.test(url);
  },
  getTitle(document: Document) {
    const fromDom = queryAny(document, chatGptSelectors.titleSelectors)?.textContent?.trim();
    return fromDom || document.title || 'ChatGPT';
  },
  isLoginRequired(document: Document) {
    return Boolean(queryAny(document, chatGptSelectors.loginSelectors));
  },
  isGenerating(document: Document) {
    return Boolean(queryAny(document, chatGptSelectors.stopButtonSelectors));
  },
  getLatestAssistantMessageText(document: Document) {
    const messages = queryAll(document, chatGptSelectors.assistantMessageSelectors);
    if (!messages.length) {
      return '';
    }
    return messages[messages.length - 1].textContent?.trim() ?? '';
  },
  getDebugSnapshot(document: Document) {
    return {
      stopButtonFound: this.isGenerating(document),
      loginFound: this.isLoginRequired(document),
      latestAssistantLength: this.getLatestAssistantMessageText(document).length,
      title: this.getTitle(document),
      url: location.href
    };
  }
};