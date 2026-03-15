export type EventName =
  | 'app launched'
  | 'workspace opened'
  | 'workspace restored'
  | 'pane created'
  | 'pane generating started'
  | 'pane completed'
  | 'pane marked read'
  | 'pane expanded'
  | 'pane collapsed'
  | 'guide updated'
  | 'preset applied'
  | 'settings updated'
  | 'telemetry opted in'
  | 'telemetry opted out'
  | 'telemetry delivery failed'
  | 'feature flags refreshed'
  | 'feature flags refresh failed';

export interface DomainEvent {
  name: EventName;
  occurredAt?: string;
  properties?: Record<string, unknown>;
}

export interface TelemetryEvent {
  event: EventName;
  timestamp: string;
  properties: Record<string, unknown>;
}

export interface TelemetryQueueItem {
  id: string;
  retryCount: number;
  nextRetryAt: number;
  createdAt: number;
  event: TelemetryEvent;
}

export interface TelemetryContext {
  appVersion: string;
  platform: NodeJS.Platform;
  provider: 'chatgpt';
  workspaceId?: string;
  paneCountTotal?: number;
  selectedMonitorId?: string;
  monitorCount?: number;
}
