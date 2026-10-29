/**
 * Stackra file contract:
 * Purpose: `AppLockConfig`, the app lock configuration (key `platform.app_lock`): on or off, the time in the
 *          background before it locks again, the passcode fallback and the per-role overrides.
 * Boundary: a configuration class over `AppLockOptions` with no env map. A host overrides it as
 *           `class AppLockConfig extends BaseAppLockConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0294 (decisions 19 and 20); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { AppLockOptions } from "#core/schemas/app-lock-options.schema";

/**
 * The app lock configuration.
 *
 * @example
 * import { AppLockConfig as BaseAppLockConfig } from "@stackra/platform";
 *
 * export class AppLockConfig extends BaseAppLockConfig {
 *   override isEnabled = true;
 *   override roles = { manager: { lockAfter: Duration.minutes(1) } };
 * }
 */
export class AppLockConfig extends Config({ schema: AppLockOptions }) {}
