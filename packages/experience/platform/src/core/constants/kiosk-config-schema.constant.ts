/**
 * Stackra file contract:
 * Purpose: `KIOSK_CONFIG_SCHEMA`, the shipped `KioskConfig$`: the kiosk launch and accessibility defaults (enter the
 *          kiosk lock on launch, the idle reset timeout, the reach layout, high contrast and audio guidance).
 * Boundary: data shape only; the defaults are in `KioskOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decisions 1 and 2); config-model (defaults a device setting overrides).
 */
import { z } from "zod";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

// shortcut: authored until gen compiles this package's KioskOptions into #stackra/schemas; replace with STA-339.
/** The shipped `KioskConfig$`. */
export const KIOSK_CONFIG_SCHEMA = z.object({
  enterOnLaunch: z.boolean(),
  idleTimeout: DURATION_SCHEMA,
  reach: z.enum(["standing", "seated"]),
  isHighContrast: z.boolean(),
  isAudioOn: z.boolean(),
});
