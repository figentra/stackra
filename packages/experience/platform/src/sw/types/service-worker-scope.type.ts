/**
 * Stackra file contract:
 * Purpose: `ServiceWorkerScope`, the slice of the service worker's global scope the handlers use: its origin, its
 *          registration (notifications, the push manager), its window clients and `skipWaiting`.
 * Boundary: a structural type, so the `./sw` entry type-checks beside the DOM lib without the WebWorker lib; the
 *           browser's `ServiceWorkerGlobalScope` satisfies it. A handler reads it from `globalThis` when it runs.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 2).
 */
import type { WindowClient } from "#sw/types/window-client.type";

/** The worker's global scope, as the handlers see it. */
export interface ServiceWorkerScope {
  /** The worker's location; its origin is the app's (ADR 0255 decision 2). */
  readonly location: { readonly origin: string };

  /** The worker's registration. */
  readonly registration: {
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
    readonly pushManager: PushManager;
  };

  /** The app's open tabs. */
  readonly clients: {
    matchAll(options: {
      type: "window";
      includeUncontrolled: boolean;
    }): Promise<readonly WindowClient[]>;
    openWindow(url: string): Promise<unknown>;
  };

  /** Activates a waiting worker at once. */
  skipWaiting(): Promise<void>;
}
