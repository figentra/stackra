/**
 * Stackra file contract:
 * Purpose: `MemoryNotificationPreferencesClientDriver`, a `NotificationPreferencesClient` held in memory, for tests,
 *          the showcase and local runs: `seed` names a scope's rows; `set` changes them, all or none.
 * Boundary: process-local; never a production store. A change to a locked channel, or to a topic or channel the scope
 *           does not offer, rejects and changes nothing, as the server refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first); ADR 0269
 *                     (decision 3); ADR 0260 (client ports).
 */
import { Driver } from "@stackra/container";

import { NotificationPreferencesClient } from "#contracts/ports/notification-preferences-client.port";
import type { NotificationPreferenceRow } from "#contracts/types/notification-preference-row.type";

/** A scope the client edits. */
type Scope = Parameters<NotificationPreferencesClient["get"]>[0];

/** The changes one `set` sends. */
type Changes = Parameters<NotificationPreferencesClient["set"]>[1];

/**
 * Preferences held in memory.
 *
 * @example
 * const preferences = new MemoryNotificationPreferencesClientDriver().seed("user", rows);
 */
export class MemoryNotificationPreferencesClientDriver extends Driver(
  NotificationPreferencesClient,
) {
  /** Each accepted `set`, oldest first, for a test to read. */
  readonly saves: { readonly scope: Scope; readonly changes: Changes }[] = [];

  /** The rows of each scope. */
  private readonly rows = new Map<Scope, readonly NotificationPreferenceRow[]>();

  /** Replaces `scope`'s rows; returns this driver. */
  seed(scope: Scope, rows: readonly NotificationPreferenceRow[]): this {
    this.rows.set(scope, rows);
    return this;
  }

  get(scope: Scope): Promise<readonly NotificationPreferenceRow[]> {
    return Promise.resolve(this.rows.get(scope) ?? []);
  }

  set(scope: Scope, changes: Changes): Promise<void> {
    const rows = this.rows.get(scope) ?? [];
    for (const change of changes) {
      const state = rows.find((row) => row.topic === change.topic)?.channels[change.channel];
      if (state === undefined)
        return Promise.reject(new Error(`${change.topic} has no ${change.channel} channel`));
      if (state.isLocked)
        return Promise.reject(new Error(`${change.topic} on ${change.channel} is locked`));
    }
    this.rows.set(
      scope,
      rows.map((row) => {
        const mine = changes.filter((change) => change.topic === row.topic);
        if (mine.length === 0) return row;
        const channels = { ...row.channels };
        for (const change of mine)
          channels[change.channel] = { isEnabled: change.isEnabled, isLocked: false };
        return { ...row, channels };
      }),
    );
    this.saves.push({ scope, changes });
    return Promise.resolve();
  }
}
