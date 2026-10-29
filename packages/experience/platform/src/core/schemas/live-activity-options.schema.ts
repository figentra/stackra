/**
 * Stackra file contract:
 * Purpose: `LiveActivityOptions`, the Live Activity defaults: how long an ended order or booking stays on the Lock
 *          Screen before the OS removes it, the Android channel of its ongoing notification, and the app and APNs
 *          environment the server's Live Activity pushes go to.
 * Boundary: defaults only; a host overrides them in its `LiveActivityConfig`. iOS caps the stay at four hours.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); config-model; STA-1539.
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { LIVE_ACTIVITY_CONFIG_SCHEMA } from "#core/constants/live-activity-config-schema.constant";

/** The Live Activity defaults. */
export class LiveActivityOptions extends Schema {
  /** The iOS bundle identifier the server's APNs pushes address; null until a host that pushes sets it. */
  // reason: a nullable string; the package's own shipped schema says it
  @Field(LIVE_ACTIVITY_CONFIG_SCHEMA.shape.apnsBundleId)
  apnsBundleId: string | null = null;

  /** The APNs environment of those pushes: `sandbox` for development builds, `production` otherwise. */
  // reason: a two-value literal union; the package's own shipped schema says it
  @Field(LIVE_ACTIVITY_CONFIG_SCHEMA.shape.apnsEnvironment)
  apnsEnvironment: "production" | "sandbox" = "production";

  /** How long an ended activity stays on the Lock Screen, showing its final state. */
  endedDismissal: Duration = Duration.minutes(15);

  /** The Android channel of the ongoing notification; the host lists it in `PushConfig.androidChannels`. */
  androidChannelId = "live_activity";
}

registerSchemas([[LiveActivityOptions, LIVE_ACTIVITY_CONFIG_SCHEMA]]);
