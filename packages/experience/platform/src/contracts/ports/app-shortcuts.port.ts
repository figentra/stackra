/**
 * Stackra file contract:
 * Purpose: the `AppShortcuts` port: App Shortcuts and Siri intents. The app handles each run of an intent it
 *          registered, the ones queued while it was closed first, and donates what the person just did so the OS
 *          suggests it later.
 * Boundary: an abstract class that is its own token, keyed `platform.AppShortcuts`; a driver per target implements it
 *           with `extends Driver(AppShortcuts)`. A run is handed to a listener once and then dropped, so a handler that
 *           throws does not see it again. A target without App Intents (Android, the web) never calls the listener,
 *           and a donation resolves the `unavailable` refusal, never an exception.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9: an official Expo library first); STA-1539.
 */
import type { Json } from "@stackra/contracts";
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ShortcutInvocation } from "#contracts/types/shortcut-invocation.type";

/**
 * App Shortcuts and Siri on this device.
 *
 * @example
 * const shortcuts = useContainer().get(AppShortcuts);
 * const stop = shortcuts.onInvoke((run) => run.intent === "ReorderLast" && orders.reorderLast.queue({}));
 * await shortcuts.donate("ReorderLast");
 */
export abstract class AppShortcuts extends Port {
  /** Type-only port key, so `DriverName<AppShortcuts>` narrows to this port's drivers. */
  declare readonly "~key": "platform.AppShortcuts";

  /**
   * Calls `listener` with each run queued while the app was closed, then with each new run, one at a time.
   *
   * @returns a function that stops listening.
   */
  abstract onInvoke(listener: (invocation: ShortcutInvocation) => void | Promise<void>): () => void;

  /** Tells the OS the person just did what intent `intent` does, with `params`, so it can suggest it. */
  abstract donate(
    intent: string,
    params?: Readonly<Record<string, Json>>,
  ): Promise<CapabilityResult>;
}
