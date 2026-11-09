/**
 * Stackra file contract:
 * Purpose: `RateLimitSettings`, the rate-limit caps an operator sets per scope without a deploy: for each API area the
 *          bucket's refill (`<area>PerMinute`) and size (`<area>Burst`), and the per-scope and per-address buckets of
 *          an action that declares no rate limit of its own (`actionPerScope`, `actionPerAddress`).
 * Boundary: a settings group of this package, keyed `rate_limit`, because its reader, the action pipeline, may not
 *           depend on settings; `SettingsRateLimitCapSourceDriver` serves it through the `RateLimitCapSource` port of
 *           `@stackra/contracts`. Resolved through the settings cascade: the platform's default, then a scope node below
 *           (the level tenancy contributes, never named here, R-59). `null`, the default, caps nothing. Each value is
 *           a cap the pipeline takes the lower of, so a setting never raises a plan's or the configuration's limit, and
 *           the floor of 1 keeps a holder from refusing every call, its own settings writes included. Never sent to
 *           clients, never a secret. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2); ADR 0307 (rules 22 to 24); ADR 0213 (decision 2); ADR 0294 (decisions
 *                     16 and 20).
 */
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { SettingScope } from "#core/enums/setting-scope.enum";

/**
 * The rate-limit caps of a scope.
 *
 * @example
 * const { appPerMinute } = await this.settings.get(RateLimitSettings, { scope });
 */
export class RateLimitSettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Node],
}) {
  /** The most calls a minute the `public` area bucket refills. */
  @Int({ min: 1 })
  publicPerMinute: number | null = null;

  /** The most calls the `public` area bucket holds at once. */
  @Int({ min: 1 })
  publicBurst: number | null = null;

  /** The most calls a minute the `app` area bucket refills. */
  @Int({ min: 1 })
  appPerMinute: number | null = null;

  /** The most calls the `app` area bucket holds at once. */
  @Int({ min: 1 })
  appBurst: number | null = null;

  /** The most calls a minute the `admin` area bucket refills. */
  @Int({ min: 1 })
  adminPerMinute: number | null = null;

  /** The most calls the `admin` area bucket holds at once. */
  @Int({ min: 1 })
  adminBurst: number | null = null;

  /** The most calls a minute the `platform` area bucket refills. */
  @Int({ min: 1 })
  platformPerMinute: number | null = null;

  /** The most calls the `platform` area bucket holds at once. */
  @Int({ min: 1 })
  platformBurst: number | null = null;

  /** The most calls a minute one scope makes to an action with no rate limit of its own. */
  @Int({ min: 1 })
  actionPerScope: number | null = null;

  /** The most calls a minute one client address makes to an action with no rate limit of its own. */
  @Int({ min: 1 })
  actionPerAddress: number | null = null;
}

/** One optional cap. */
const CAP = z.number().int().min(1).nullable().default(null);

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RateLimitSettings,
    z.object({
      publicPerMinute: CAP,
      publicBurst: CAP,
      appPerMinute: CAP,
      appBurst: CAP,
      adminPerMinute: CAP,
      adminBurst: CAP,
      platformPerMinute: CAP,
      platformBurst: CAP,
      actionPerScope: CAP,
      actionPerAddress: CAP,
    }),
  ],
]);
