/**
 * Stackra file contract:
 * Purpose: `APP_LOCK_CONFIG_SCHEMA`, the shipped `AppLockConfig$`: whether the app lock is on, how long the app may
 *          stay in the background before it locks again, the passcode fallback, and the per-role overrides.
 * Boundary: data shape only; the defaults are in `AppLockOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); config-model.
 */
import { z } from "zod";

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

// shortcut: authored until gen compiles this package's AppLockOptions into #stackra/schemas; replace with STA-339.
/** The shipped `AppLockConfig$`. */
export const APP_LOCK_CONFIG_SCHEMA = z.object({
  isEnabled: z.boolean(),
  lockAfter: DURATION_SCHEMA,
  allowPasscode: z.boolean(),
  roles: z.record(
    z.string(),
    z.object({ isEnabled: z.boolean().optional(), lockAfter: DURATION_SCHEMA.optional() }),
  ),
});
