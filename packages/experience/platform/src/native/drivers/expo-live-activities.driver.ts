/**
 * Stackra file contract:
 * Purpose: `ExpoLiveActivitiesDriver`, the `LiveActivities` driver of the Expo (phone) target: an order or booking in
 *          progress as the `OrderProgress` Live Activity through expo-widgets on iOS, and as an ongoing (sticky)
 *          notification through expo-notifications on Android; on iOS also the activity's APNs push token and the
 *          push-to-start tokens the server pushes to.
 * Boundary: each running activity's ActivityKit id is kept by reference in the `prefs` storage area, so an activity
 *           started before a relaunch is updated and ended, not started twice. iOS resolves `unavailable` when the OS
 *           refuses the start (Live Activities switched off, iOS before 16.2, an Expo Go session); Android resolves
 *           `permission_denied` without the notification permission and `unavailable` when `androidChannelId` was not
 *           created (the host lists it in `PushConfig.androidChannels`) or the OS refuses the post. An ended iOS
 *           activity stays for `endedDismissal`; an ended Android one shows `final` as an ordinary notification. Push
 *           tokens need expo-widgets' `enablePushNotifications`; Android has none.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9); ADR 0256 (decision 2); ADR 0294 (decision 17:
 *                     dependencies by type); STA-1539.
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Storage } from "@stackra/storage/contracts";
import * as Notifications from "expo-notifications";
import { addPushToStartTokenListener, after } from "expo-widgets";
import type { LiveActivity } from "expo-widgets";
import { Platform as Os } from "react-native";

import type { LiveActivityConfig } from "#config/live-activity.config";
import { LiveActivities } from "#contracts/ports/live-activities.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { LIVE_ACTIVITIES_STORAGE_KEY } from "#core/constants/live-activities-storage-key.constant";
import { LIVE_ACTIVITY_CAPABILITY } from "#core/constants/live-activity-capability.constant";
import { refuse } from "#core/functions/refuse.function";
import { ORDER_PROGRESS_ACTIVITY } from "#native/constants/order-progress-activity.constant";
import { readPushPermission } from "#native/functions/read-push-permission.function";
import type { OrderProgressProps } from "#native/types/order-progress-props.type";

/**
 * Live Activities on a phone.
 *
 * @example
 * // generated wiring, expo target
 * { port: LiveActivities, candidates: { expo: () => import("@stackra/platform/native").then((m) => m.ExpoLiveActivitiesDriver) } }
 */
export class ExpoLiveActivitiesDriver extends Driver(LiveActivities) {
  /** The Live Activity configuration (`endedDismissal`, `androidChannelId`). */
  private readonly config: LiveActivityConfig;

  /** The client storage whose `prefs` area keeps the running activities' ids. */
  private readonly storage: Storage;

  /**
   * @param config - the Live Activity configuration.
   * @param storage - the client storage, hydrated before the first frame.
   */
  constructor(config: LiveActivityConfig, storage: Storage) {
    super();
    this.config = config;
    this.storage = storage;
  }

  /** Starts the activity of `progress.reference`, or updates the running one, even from before a relaunch. */
  async show(progress: ActivityProgress): Promise<CapabilityResult> {
    if (Os.OS === "android") return this.notify(progress, true);
    if (Os.OS !== "ios") return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    const { url, ...props } = progress;
    try {
      const running = this.running(props.reference);
      if (running) await running.update(props);
      else this.remember(props.reference, ORDER_PROGRESS_ACTIVITY.start(props, url).getId());
      return { ok: true, data: undefined };
    } catch {
      return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    }
  }

  /** Ends the activity of `reference` with `final` shown until the configured dismissal. */
  async end(reference: string, final?: ActivityProgress): Promise<void> {
    if (Os.OS === "android") {
      if (final) await this.notify(final, false);
      else await Notifications.dismissNotificationAsync(reference).catch(() => undefined);
      return;
    }
    if (Os.OS !== "ios") return;
    const running = this.running(reference);
    this.remember(reference, undefined);
    if (!running) return;
    const until = new Date(Date.now() + Duration.toMilliseconds(this.config.endedDismissal));
    const { url: _url, ...props }: Partial<ActivityProgress> = final ?? {};
    await running.end(after(until), final ? (props as OrderProgressProps) : undefined, new Date());
  }

  /** The running activity's APNs token, or `null` (Android, none running, none issued yet). */
  async pushToken(reference: string): Promise<string | null> {
    if (Os.OS !== "ios") return null;
    try {
      return (await this.running(reference)?.getPushToken()) ?? null;
    } catch {
      return null;
    }
  }

  /** Listens for push-to-start tokens on iOS; elsewhere nothing is ever issued. */
  onPushToStartToken(listener: (token: string) => void): () => void {
    if (Os.OS !== "ios") return () => undefined;
    const subscription = addPushToStartTokenListener((event) =>
      listener(event.activityPushToStartToken),
    );
    return () => subscription.remove();
  }

  /** The running activity of `reference`, found by the id kept for it. */
  private running(reference: string): LiveActivity<OrderProgressProps> | undefined {
    const id = this.ids()[reference];
    if (id === undefined) return undefined;
    return ORDER_PROGRESS_ACTIVITY.getInstances().find((activity) => activity.getId() === id);
  }

  /** The kept ids by reference; anything unreadable reads as none. */
  private ids(): Readonly<Record<string, string>> {
    const stored = this.storage.prefs.get(LIVE_ACTIVITIES_STORAGE_KEY);
    if (stored === null || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(
      Object.entries(stored).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  }

  /** Keeps `id` for `reference` (or forgets it), dropping the ids of activities no longer running. */
  private remember(reference: string, id: string | undefined): void {
    const live = new Set(
      ORDER_PROGRESS_ACTIVITY.getInstances().map((activity) => activity.getId()),
    );
    const ids = Object.fromEntries(
      Object.entries(this.ids()).filter(([key, kept]) => key !== reference && live.has(kept)),
    );
    if (id !== undefined) ids[reference] = id;
    this.storage.prefs.set(LIVE_ACTIVITIES_STORAGE_KEY, ids);
  }

  /** Posts `progress` as the Android notification of its reference: ongoing while it runs, ordinary once ended. */
  private async notify(progress: ActivityProgress, ongoing: boolean): Promise<CapabilityResult> {
    if ((await readPushPermission()) !== "granted")
      return refuse(LIVE_ACTIVITY_CAPABILITY, "permission_denied");
    try {
      // Android 8+ silently drops a post on a channel that does not exist.
      if ((await Notifications.getNotificationChannelAsync(this.config.androidChannelId)) === null)
        return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
      await Notifications.scheduleNotificationAsync({
        identifier: progress.reference,
        content: {
          title: progress.title,
          body: `${progress.status} · ${progress.step}/${progress.steps}`,
          data: progress.url === undefined ? {} : { url: progress.url },
          sticky: ongoing,
          autoDismiss: !ongoing,
        },
        trigger: { channelId: this.config.androidChannelId },
      });
      return { ok: true, data: undefined };
    } catch {
      return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    }
  }
}
