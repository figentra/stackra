/**
 * Stackra file contract:
 * Purpose: `LIVE_ACTIVITY_CONFIG_SCHEMA`, the shipped `LiveActivityConfig$`: how long an ended Live Activity stays on
 *          the Lock Screen, the Android channel of its ongoing notification, and where the server's APNs pushes go.
 * Boundary: data shape only; the defaults are in `LiveActivityOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); config-model; STA-1539.
 */
import { z } from "zod";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

// shortcut: authored until gen compiles this package's LiveActivityOptions into #stackra/schemas; replace with STA-339.
/** The shipped `LiveActivityConfig$`. */
export const LIVE_ACTIVITY_CONFIG_SCHEMA = z.object({
  endedDismissal: DURATION_SCHEMA,
  androidChannelId: z.string().min(1),
  apnsBundleId: z.string().min(1).nullable(),
  apnsEnvironment: z.enum(["production", "sandbox"]),
});
