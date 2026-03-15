import { PostHog } from 'posthog-node';
import { AppSettings } from './persistence';

export interface FeatureFlagSnapshot {
  blinkEnabled: boolean;
  slowThresholdMs: number;
  stalledThresholdMs: number;
}

const DEFAULT_FLAGS: FeatureFlagSnapshot = {
  blinkEnabled: true,
  slowThresholdMs: 20_000,
  stalledThresholdMs: 45_000
};

export class FeatureFlagService {
  private flags: FeatureFlagSnapshot = { ...DEFAULT_FLAGS };

  async refresh(settings: AppSettings, distinctId: string): Promise<FeatureFlagSnapshot> {
    const key = settings.posthogProjectApiKey?.trim();
    if (!settings.telemetryOptIn || !key) {
      this.flags = { ...DEFAULT_FLAGS };
      return this.flags;
    }

    try {
      const client = new PostHog(key, {
        host: settings.posthogHost || 'https://us.i.posthog.com'
      });

      const ph = client as unknown as {
        getFeatureFlag?: (flag: string, id: string) => Promise<unknown>;
        shutdownAsync?: () => Promise<void>;
      };

      const blinkFlag = ph.getFeatureFlag
        ? await ph.getFeatureFlag('blinkEnabled', distinctId)
        : DEFAULT_FLAGS.blinkEnabled;
      const slowThreshold = ph.getFeatureFlag
        ? await ph.getFeatureFlag('slowThresholdMs', distinctId)
        : DEFAULT_FLAGS.slowThresholdMs;
      const stalledThreshold = ph.getFeatureFlag
        ? await ph.getFeatureFlag('stalledThresholdMs', distinctId)
        : DEFAULT_FLAGS.stalledThresholdMs;

      this.flags = {
        blinkEnabled: typeof blinkFlag === 'boolean' ? blinkFlag : DEFAULT_FLAGS.blinkEnabled,
        slowThresholdMs:
          typeof slowThreshold === 'number' ? slowThreshold : Number(slowThreshold) || DEFAULT_FLAGS.slowThresholdMs,
        stalledThresholdMs:
          typeof stalledThreshold === 'number'
            ? stalledThreshold
            : Number(stalledThreshold) || DEFAULT_FLAGS.stalledThresholdMs
      };

      if (ph.shutdownAsync) {
        await ph.shutdownAsync();
      }

      return this.flags;
    } catch (error) {
      console.warn('[feature-flags] refresh failed, falling back to defaults', error);
      this.flags = { ...DEFAULT_FLAGS };
      return this.flags;
    }
  }

  getSnapshot() {
    return this.flags;
  }
}
