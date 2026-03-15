export interface SiteAdapter {
  id: string;
  match(url: string): boolean;
  getTitle(document: Document): string;
  isLoginRequired(document: Document): boolean;
  isGenerating(document: Document): boolean;
  getLatestAssistantMessageText(document: Document): string;
  getDebugSnapshot(document: Document): Record<string, unknown>;
}