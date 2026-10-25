/**
 * Stackra file contract:
 * Purpose: the `FlagProvider` port: where flag values come from for one subject. The `config` driver answers from
 *          `FeatureFlagsConfig.values` (dev, on-prem, build-time flags); the `posthog` driver asks PostHog (SaaS).
 * Boundary: an abstract class that is its own token, keyed `feature_flags.FlagProvider`, so a config field typed
 *           `DriverName<FlagProvider>` takes only this port's driver names. A provider returns the values it knows;
 *           a flag it does not answer keeps its declared default, so a provider never needs the flag list.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: native and PostHog drivers); ADR 0294 (decisions 4, 15 and 16); ADR 0263
 *                     (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { FlagContext } from "#contracts/types/flag-context.type";

/**
 * Answers flag values for one subject.
 *
 * @example
 * export class ConfigFlagProviderDriver extends Driver(FlagProvider) {
 *   values(): Promise<Readonly<Record<string, boolean>>> {
 *     return Promise.resolve(this.config.values);
 *   }
 * }
 */
export abstract class FlagProvider extends Port {
  /** Type-only port key, so `DriverName<FlagProvider>` narrows to this port's drivers. */
  declare readonly "~key": "feature_flags.FlagProvider";

  /**
   * The values this provider knows for `context`, by flag key (`web.help_centre`); a missing key keeps its default.
   *
   * @throws Error when the source cannot be reached; the reader then keeps its last values.
   */
  abstract values(context: FlagContext): Promise<Readonly<Record<string, boolean>>>;
}
