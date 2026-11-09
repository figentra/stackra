/**
 * Stackra file contract:
 * Purpose: the `IdempotencyRetentionSource` port: how long the idempotency step of `@stackra/actions` keeps an
 *          Idempotency-Key with its result, as an operator's settings set it.
 * Boundary: an abstract class that is its own token. `@stackra/settings` ships the driver
 *           (`SettingsIdempotencyRetentionSourceDriver`, over its `IdempotencySettings` group). The port lives here
 *           because actions and settings both depend on this package and neither may depend on the other. The answer
 *           only shortens the window: the pipeline never lets it pass the 24 hours of ADR 0136. With none bound the
 *           window is 24 hours.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3: stored for 24 hours); ADR 0213 (decision 2: the settings cascade).
 */
import { Port } from "#core/bases/port.base";
import type { Duration } from "#core/constants/duration.constant";
import type { ScopeRef } from "#core/types/scope-ref.type";

/**
 * Reads the idempotency retention window.
 *
 * @example
 * export class SettingsIdempotencyRetentionSourceDriver extends Driver(IdempotencyRetentionSource) {
 *   async retention(scope: ScopeRef | undefined): Promise<Duration> {
 *     const settings = await this.reader.get(IdempotencySettings, scope === undefined ? {} : { scope });
 *     return Duration.hours(settings.retentionHours);
 *   }
 * }
 */
export abstract class IdempotencyRetentionSource extends Port {
  /**
   * How long a key is kept for `scope` (the running scope session's node when absent).
   *
   * @throws Error when the window cannot be read; the call fails, as for the rate-limit caps, rather than keeping a
   *         key for a window nobody chose.
   */
  abstract retention(scope: ScopeRef | undefined): Promise<Duration>;
}
