/**
 * Stackra file contract:
 * Purpose: `KioskOptions`, the kiosk launch and accessibility defaults: whether the app enters the operating system's
 *          kiosk lock on launch, how long a kiosk waits without input before it resets, and the reach, high contrast
 *          and audio defaults its `KioskSurface` starts with.
 * Boundary: defaults only, each overridden per device by the device's settings (its device-catalogue kind and its
 *           venue), never decided in code. The surface itself is `@stackra/ui`'s `KioskSurface`.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decisions 1 and 2); R3-SO-10; config-model.
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { KIOSK_CONFIG_SCHEMA } from "#core/constants/kiosk-config-schema.constant";

/** The kiosk defaults. */
export class KioskOptions extends Schema {
  /** The reach layout the surface starts in: `standing` or `seated`. */
  // reason: a two-value literal union; the package's own shipped schema says it
  @Field(KIOSK_CONFIG_SCHEMA.shape.reach)
  reach: "standing" | "seated" = "standing";

  /** Enter the kiosk lock (`KioskMode.enter`) when the app launches; a device's kind or setting switches it on. */
  enterOnLaunch = false;

  /** How long without a touch, a key or a pointer before the kiosk resets to its attract screen. */
  idleTimeout: Duration = Duration.seconds(90);

  /** Start in high contrast. */
  isHighContrast = false;

  /** Start with audio guidance on. */
  isAudioOn = false;
}

registerSchemas([[KioskOptions, KIOSK_CONFIG_SCHEMA]]);
