/// <reference types="vite/client" />

import { AppSettings, Workspace } from '../main/persistence';
import { DomainEvent } from '../main/telemetry/types';

declare global {
  interface Window {
    electronAPI: {
      bootstrap: () => Promise<{
        settings: AppSettings;
        workspace: Workspace | null;
        monitors: Array<{
          id: string;
          isPrimary: boolean;
          bounds: { x: number; y: number; width: number; height: number };
          scaleFactor: number;
        }>;
        currentMonitorId: string;
        paneObserverPreloadPath: string;
        featureFlags: {
          blinkEnabled: boolean;
          slowThresholdMs: number;
          stalledThresholdMs: number;
        };
      }>;
      updateSettings: (settings: AppSettings) => Promise<{ ok: true }>;
      updateWorkspace: (workspace: Workspace | null) => Promise<{ ok: true }>;
      setAlwaysOnTop: (value: boolean) => Promise<{ ok: true }>;
      captureTelemetry: (event: DomainEvent) => Promise<{ ok: true }>;
      refreshFeatureFlags: (distinctId: string) => Promise<{
        blinkEnabled: boolean;
        slowThresholdMs: number;
        stalledThresholdMs: number;
      }>;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        preload?: string;
        partition?: string;
        allowpopups?: string;
      };
    }
  }
}

export {};