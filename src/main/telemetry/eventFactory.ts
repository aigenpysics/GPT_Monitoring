import { DomainEvent, TelemetryContext, TelemetryEvent } from './types';

const FORBIDDEN_KEYS = new Set([
  'rawPrompt',
  'rawResponse',
  'rawNotes',
  'rawObjective',
  'rawDomHtml',
  'sessionCookie',
  'authToken'
]);

function sanitizeProperties(input: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!input) {
    return {};
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

export function createTelemetryEvent(context: TelemetryContext, input: DomainEvent): TelemetryEvent {
  const timestamp = input.occurredAt ?? new Date().toISOString();
  const safeProperties = sanitizeProperties(input.properties);

  return {
    event: input.name,
    timestamp,
    properties: {
      app_version: context.appVersion,
      platform: context.platform,
      provider: context.provider,
      workspace_id: context.workspaceId,
      pane_count_total: context.paneCountTotal,
      selected_monitor_id: context.selectedMonitorId,
      monitor_count: context.monitorCount,
      observer_version: 'v1',
      adapter_name: 'chatgpt',
      ...safeProperties
    }
  };
}
