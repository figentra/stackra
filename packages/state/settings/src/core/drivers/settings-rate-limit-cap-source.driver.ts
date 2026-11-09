/**
 * Stackra file contract:
 * Purpose: `SettingsRateLimitCapSourceDriver`, the `RateLimitCapSource` of a service that has settings: it answers the
 *          `RateLimitSettings` caps of one API area for a scope, which the action pipeline's rate-limit step applies.
 * Boundary: reads through `SettingsReader#get`, so floors, locks and entitlements apply exactly as for any read; with no
 *           scope it reads the running scope session's node. A failed read throws, so the call fails closed. It names
 *           no `@stackra/actions` type: the port lives in `@stackra/contracts`, which both packages depend on.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2); ADR 0213 (decision 2: the cascade).
 */
import { Driver } from "@stackra/container";
import {
  type ApiArea,
  RateLimitCapSource,
  type RateLimitCaps,
  type ScopeRef,
} from "@stackra/contracts";

import { RateLimitSettings } from "#core/rate-limit.settings";
import type { SettingsReader } from "#core/services/settings-reader.service";

/**
 * Reads a scope's rate-limit caps from its settings.
 *
 * @example
 * container.bind(RateLimitCapSource, SettingsRateLimitCapSourceDriver);
 * await source.caps(ApiArea.App, scope); // { perMinute: 30, burst: null, actionPerScope: null, actionPerAddress: null }
 */
export class SettingsRateLimitCapSourceDriver extends Driver(RateLimitCapSource) {
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
   * The caps `scope` sets for `area`.
   *
   * @throws Error when the settings cannot be read; the call fails, it is never let through unlimited.
   */
  async caps(area: ApiArea, scope: ScopeRef | undefined): Promise<RateLimitCaps> {
    const settings = await this.reader.get(RateLimitSettings, scope === undefined ? {} : { scope });
    return {
      perMinute: settings[`${area}PerMinute`],
      burst: settings[`${area}Burst`],
      actionPerScope: settings.actionPerScope,
      actionPerAddress: settings.actionPerAddress,
    };
  }
}
