import { app } from 'electron';
import Store from 'electron-store';
import { randomUUID } from 'node:crypto';
import { PostHog } from 'posthog-node';
import { AppSettings } from '../persistence';
import { createTelemetryEvent } from './eventFactory';
import { DomainEvent, TelemetryContext, TelemetryEvent, TelemetryQueueItem } from './types';

interface TelemetryStoreShape {
  queue: TelemetryQueueItem[];
}

const RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 300_000, 900_000];
const MAX_QUEUE_SIZE = 500;

export class TelemetryService {
  private store = new Store<TelemetryStoreShape>({
    name: 'gpt-monitor-wall-telemetry',
    defaults: {
      queue: []
    }
  });

  private worker: NodeJS.Timeout | null = null;
  private client: PostHog | null = null;
  private settings: AppSettings;
  private sending = false;
  private context: TelemetryContext = {
    appVersion: app.getVersion(),
    platform: process.platform,
    provider: 'chatgpt'
  };

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.refreshClient();
    this.startRetryWorker();
  }

  setContext(partial: Partial<TelemetryContext>) {
    this.context = {
      ...this.context,
      ...partial
    };
  }

  updateSettings(settings: AppSettings) {
    this.settings = settings;
    this.refreshClient();
  }

  capture(domainEvent: DomainEvent) {
    const normalized = createTelemetryEvent(this.context, domainEvent);
    this.enqueue(normalized);
    if (this.shouldSendRemote()) {
      void this.flush();
    }
  }

  captureImmediate(domainEvent: DomainEvent) {
    const normalized = createTelemetryEvent(this.context, domainEvent);
    this.enqueue(normalized);
    if (this.shouldSendRemote()) {
      void this.flush();
    }
  }

  async flush() {
    if (this.sending || !this.shouldSendRemote()) {
      return;
    }

    const queue = this.getQueue();
    if (!queue.length) {
      return;
    }

    this.sending = true;
    try {
      const now = Date.now();
      const nextQueue: TelemetryQueueItem[] = [];

      for (const item of queue) {
        if (item.nextRetryAt > now) {
          nextQueue.push(item);
          continue;
        }

        try {
          await this.send(item.event);
        } catch (error) {
          const retryCount = item.retryCount + 1;
          const delay = RETRY_DELAYS_MS[Math.min(retryCount - 1, RETRY_DELAYS_MS.length - 1)];
          nextQueue.push({
            ...item,
            retryCount,
            nextRetryAt: Date.now() + delay
          });

          this.captureLocalFailure(item.event, error);
        }
      }

      this.store.set('queue', nextQueue.slice(-MAX_QUEUE_SIZE));
    } finally {
      this.sending = false;
    }
  }

  async shutdown() {
    await this.flush();
    if (this.client) {
      const client = this.client as unknown as {
        shutdown?: () => Promise<void> | void;
      };
      if (client.shutdown) {
        await client.shutdown();
      }
      this.client = null;
    }
    if (this.worker) {
      clearInterval(this.worker);
      this.worker = null;
    }
  }

  private startRetryWorker() {
    if (this.worker) {
      return;
    }
    this.worker = setInterval(() => {
      void this.flush();
    }, 10_000);
  }

  private refreshClient() {
    this.client = null;
    const key = this.settings.posthogProjectApiKey?.trim();

    if (!this.settings.telemetryOptIn || !key) {
      return;
    }

    try {
      this.client = new PostHog(key, {
        host: this.settings.posthogHost || 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0
      });
    } catch (error) {
      console.error('[telemetry] failed to init PostHog client', error);
      this.client = null;
    }
  }

  private shouldSendRemote() {
    return Boolean(this.settings.telemetryOptIn && this.client);
  }

  private enqueue(event: TelemetryEvent) {
    const queue = this.getQueue();
    queue.push({
      id: randomUUID(),
      retryCount: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
      event
    });
    this.store.set('queue', queue.slice(-MAX_QUEUE_SIZE));
  }

  private getQueue() {
    return this.store.get('queue', []);
  }

  private async send(event: TelemetryEvent) {
    if (!this.client) {
      return;
    }

    await this.client.capture({
      distinctId: event.properties.workspace_id ? String(event.properties.workspace_id) : 'workspace:unknown',
      event: event.event,
      timestamp: new Date(event.timestamp),
      properties: event.properties
    });
  }

  private captureLocalFailure(event: TelemetryEvent, error: unknown) {
    console.warn('[telemetry] delivery failed', {
      event: event.event,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
