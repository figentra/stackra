/**
 * Stackra file contract:
 * Purpose: `PushOptions`, the shape of `PushConfig`: which transport registers the device, how often registration is
 *          retried, how a notification shows while the app is open, the Android channels, when the OS prompt first
 *          shows, iOS provisional authorization, and the Web Push public key.
 * Boundary: a shape class; it registers this package's own schema (`PUSH_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(PushConfig)` validates with no generated file. Read by the push context of the
 *           app runtime and by the push drivers; nothing here is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decision 3); ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34).
 */
import "#core/types/push-transport-driver-names.type";
import type { DriverName } from "@stackra/container";
import { Field, Int, registerSchemas, Schema } from "@stackra/validation";

import type { PushTransport } from "#contracts/ports/push-transport.port";
import { PUSH_CONFIG_SCHEMA } from "#core/constants/push-config-schema.constant";
import type { NotificationImportance } from "#core/enums/notification-importance.enum";
import { PromptMoment } from "#core/enums/prompt-moment.enum";

/**
 * The push settings.
 *
 * @example
 * export class PushConfig extends BasePushConfig {
 *   override provider: DriverName<PushTransport> = "expo";
 *   override askOn: PromptMoment = PromptMoment.FirstSession;
 * }
 */
export class PushOptions extends Schema {
  /** Registration attempts after the first one before the app gives up for this launch. */
  @Int({
    min: 0,
    max: 10,
  })
  retries = 3;

  /** The Android channels created at first launch; `nameKey` is translated when the channel is created. */
  // reason: a nested options object with no shape class; the package's own shipped schema says it
  @Field(PUSH_CONFIG_SCHEMA.shape.androidChannels.unwrap())
  androidChannels: {
    /** The channel id a push names (snake_case). */
    id: string;
    /** The translation key of the channel's name in the OS settings. */
    nameKey: string;
    /** How much the channel's notifications interrupt. */
    importance: NotificationImportance;
    /** Vibrate on arrival. */
    vibrate: boolean;
    /** The sound name (`default`), or null for silence. */
    sound: string | null;
  }[] = [];

  /** The push transport driver; `memory` registers nothing real. */
  provider: DriverName<PushTransport> = "memory";

  /** Show a banner for a notification that arrives while the app is open. */
  foregroundBanner = true;

  /** Play the sound of a notification that arrives while the app is open. */
  foregroundSound = true;

  /** Update the app icon badge for a notification that arrives while the app is open. */
  foregroundBadge = true;

  /** When the OS prompt is first shown. */
  askOn: PromptMoment = PromptMoment.Settings;

  /** iOS: ask for provisional (quiet) authorization first. */
  iosProvisional = false;

  /** The Web Push (VAPID) public key the `web` transport subscribes with; empty off the web. */
  vapidPublicKey = "";
}

registerSchemas([[PushOptions, PUSH_CONFIG_SCHEMA]]);
