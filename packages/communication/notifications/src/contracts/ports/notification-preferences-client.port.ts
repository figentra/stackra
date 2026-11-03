/**
 * Stackra file contract:
 * Purpose: the `NotificationPreferencesClient` client port: reads and changes the signed-in person's (or their
 *          organisation's) notification preferences, for `NotificationPreferences`. It is the client view of the
 *          server's `PreferenceStore`.
 * Boundary: an abstract class that is its own token. An app binds it to its generated client; it acts on the signed-in
 *           person or the active organisation, so it takes no principal or scope id. A locked channel is never in a
 *           `set`; the server refuses one anyway. `MemoryNotificationPreferencesClientDriver` in `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0263 (ports and drivers); ADR 0223 (decision 5 as amended by
 *                     ADR 0270); the UI build list client ports note (2026-11-02).
 */
import { Port } from "@stackra/contracts";

import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import type { NotificationPreferenceRow } from "#contracts/types/notification-preference-row.type";

/**
 * The client's notification preferences.
 *
 * @example
 * const preferences = useContainer().get(NotificationPreferencesClient);
 * await preferences.set("user", [{ topic: "orders", channel: NotificationChannel.Push, isEnabled: true }]);
 */
export abstract class NotificationPreferencesClient extends Port {
  /** Every topic and its channels, for the person (`user`) or their organisation (`tenant`). */
  abstract get(scope: "user" | "tenant"): Promise<readonly NotificationPreferenceRow[]>;

  /** Turns the named topics' channels on or off, all or none. */
  abstract set(
    scope: "user" | "tenant",
    changes: readonly {
      readonly topic: string;
      readonly channel: NotificationChannel;
      readonly isEnabled: boolean;
    }[],
  ): Promise<void>;
}
