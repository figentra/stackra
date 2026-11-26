/**
 * Stackra file contract:
 * Purpose: the `RateLimitCapSource` port: the rate-limit caps one scope's settings set for one API area, which the
 *          rate-limit step of `@stackra/actions` applies over the plan-sized or configured buckets, so an operator
 *          changes a scope's limits without a deploy.
 * Boundary: an abstract class that is its own token. `@stackra/settings` ships the driver
 *           (`SettingsRateLimitCapSourceDriver`, over its `RateLimitSettings` group). The port lives here because
 *           actions and settings both depend on this package and neither may depend on the other. A cap only lowers a
 *           limit; with none bound the pipeline applies no cap.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: token buckets per area and scope); ADR 0213 (decision 2: the settings
 *                     cascade).
 */
import { Port } from "#core/bases/port.base";
import type { ApiArea } from "#core/enums/api-area.enum";
import type { RateLimitCaps } from "#core/types/rate-limit-caps.type";
import type { ScopeRef } from "#core/types/scope-ref.type";

/**
 * Reads a scope's rate-limit caps.
 *
 * @example
 * export class SettingsRateLimitCapSourceDriver extends Driver(RateLimitCapSource) {
 *   async caps(area: ApiArea, scope: ScopeRef | undefined): Promise<RateLimitCaps> {
 *     return this.capsOf(await this.reader.get(RateLimitSettings, scope === undefined ? {} : { scope }), area);
 *   }
 * }
 */
export abstract class RateLimitCapSource extends Port {
  /**
   * The caps `scope` (the running scope session's node when absent) sets for `area`.
   *
   * @throws Error when the caps cannot be read; the call fails, it is never let through unlimited.
   */
  abstract caps(area: ApiArea, scope: ScopeRef | undefined): Promise<RateLimitCaps>;
}
