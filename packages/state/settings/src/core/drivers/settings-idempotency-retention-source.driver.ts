/**
 * Stackra file contract:
 * Purpose: `SettingsIdempotencyRetentionSourceDriver`, the `IdempotencyRetentionSource` of a service that has
 *          settings: it answers the `IdempotencySettings` retention window, which the action pipeline's idempotency
 *          step applies (an action's own shorter window still wins).
 * Boundary: reads through `SettingsReader#get`, so floors, locks and entitlements apply exactly as for any read. A
 *           failed read throws, so the call fails closed. It names no `@stackra/actions` type: the port lives in
 *           `@stackra/contracts`, which both packages depend on.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0213 (decision 2: the cascade).
 */
import { Driver } from "@stackra/container";
import { Duration, IdempotencyRetentionSource, type ScopeRef } from "@stackra/contracts";

import { IdempotencySettings } from "#core/idempotency.settings";
import type { SettingsReader } from "#core/services/settings-reader.service";

/**
 * Reads the idempotency retention window from settings.
 *
 * @example
 * container.bind(IdempotencyRetentionSource, SettingsIdempotencyRetentionSourceDriver);
 * await source.retention(undefined); // Duration.hours(24)
 */
export class SettingsIdempotencyRetentionSourceDriver extends Driver(IdempotencyRetentionSource) {
  /** The settings reader over the stores. */
  private readonly reader: SettingsReader;

  /**
   * @param reader - the settings reader.
   */
  constructor(reader: SettingsReader) {
    super();
    this.reader = reader;
  }

  /**
   * The retention window, from the platform's `IdempotencySettings`.
   *
   * @throws Error when the settings cannot be read; the call fails.
   */
  async retention(scope: ScopeRef | undefined): Promise<Duration> {
    const settings = await this.reader.get(
      IdempotencySettings,
      scope === undefined ? {} : { scope },
    );
    return Duration.hours(settings.retentionHours);
  }
}
