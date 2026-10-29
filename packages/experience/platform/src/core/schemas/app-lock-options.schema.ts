/**
 * Stackra file contract:
 * Purpose: `AppLockOptions`, the shape of `AppLockConfig`: the opt-in app lock (off by default), the time in the
 *          background after which it locks again, the device passcode as the fallback, and per-role overrides.
 * Boundary: a shape class; it registers this package's own schema (`APP_LOCK_CONFIG_SCHEMA`) when the module loads,
 *           so `buildConfig(AppLockConfig)` validates with no generated file. A role key is the role's name as the
 *           app's session reports it; `appLockPolicy` merges its override over the app-wide values.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0294 (decisions 19, 20 and 26).
 */
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { APP_LOCK_CONFIG_SCHEMA } from "#core/constants/app-lock-config-schema.constant";

/** The app lock settings. */
export class AppLockOptions extends Schema {
  /** Overrides by role name, merged over the app-wide values (a manager locks sooner than a cashier). */
  // reason: a record of partial overrides with no shape class; the package's own shipped schema says it
  @Field(APP_LOCK_CONFIG_SCHEMA.shape.roles)
  roles: Record<
    string,
    {
      /** Whether this role's sessions lock. */
      isEnabled?: boolean;
      /** This role's time in the background before it locks again. */
      lockAfter?: Duration;
    }
  > = {};

  /** Lock the app on launch and after `lockAfter` in the background; off unless the app opts in. */
  isEnabled = false;

  /** How long the app may stay in the background before it asks again; zero asks on every return. */
  lockAfter: Duration = Duration.minutes(5);

  /** Accept the device passcode when biometrics fail or are not enrolled. */
  allowPasscode = true;
}

registerSchemas([[AppLockOptions, APP_LOCK_CONFIG_SCHEMA]]);
