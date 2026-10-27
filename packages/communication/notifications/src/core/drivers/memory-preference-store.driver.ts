/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `PreferenceStore` port: keeps each recipient's choices per category and channel
 *          in the process, for dev and tests, and answers by `preferenceAllows` with the pack's mandatory categories.
 * Boundary: one map per instance, lost with the process. The mandatory list comes from `NotificationsConfig`
 *           (`mandatoryCategories`), none when no config is bound; turning a category off that cannot be muted records
 *           nothing and answers false.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0305 (rule 8); ACA-539; STA-964;
 *                     stackra-218 (STA-1376).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import type { NotificationsConfig } from "#config/notifications.config";
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { PreferenceStore } from "#contracts/ports/preference-store.port";
import { canMute } from "#core/functions/can-mute.function";
import { preferenceAllows } from "#core/functions/preference-allows.function";

/**
 * Preferences in memory.
 *
 * @example
 * const preferences = new MemoryPreferenceStoreDriver(config);
 * await preferences.set(principalId, "marketing", NotificationChannel.Mail, true);
 */
export class MemoryPreferenceStoreDriver extends Driver(PreferenceStore) {
  /** Choices keyed `<recipient> <category> <channel>`. */
  private readonly choices = new Map<string, boolean>();

  /** The pack's mandatory categories. */
  private readonly mandatory: readonly string[];

  /**
   * @param config - the notifications configuration; its `mandatoryCategories` can never be turned off.
   */
  constructor(config?: NotificationsConfig) {
    super();
    this.mandatory = config?.mandatoryCategories ?? [];
  }

  /** Whether `category` may reach `recipient` on `channel`. */
  async allows(
    recipient: PublicId<"usr">,
    category: string,
    channel: NotificationChannel,
  ): Promise<boolean> {
    return preferenceAllows(
      category,
      this.mandatory,
      this.choices.get(`${recipient} ${category} ${channel}`),
    );
  }

  /** Records the choice; false, recording nothing, when turning off a category that cannot be muted. */
  async set(
    recipient: PublicId<"usr">,
    category: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<boolean> {
    if (!enabled && !canMute(category, this.mandatory)) return false;
    this.choices.set(`${recipient} ${category} ${channel}`, enabled);
    return true;
  }
}
