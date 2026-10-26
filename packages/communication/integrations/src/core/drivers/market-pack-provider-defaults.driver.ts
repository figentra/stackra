/**
 * Stackra file contract:
 * Purpose: `MarketPackProviderDefaultsDriver`, the production `ProviderDefaults` for every capability: the providers a
 *          Market offers for one, read from its market pack's `providers.<capability>` list in force today
 *          (`providers.sms`, `providers.payroll`), live entries only, in the pack's order, each with the platform
 *          Connection the deployment runs for it (none for a provider only a tenant's own account serves).
 * Boundary: the driver named `market-pack`, modelled on payments' `MarketPackPaymentDefaultsDriver`. It reads the pack
 *           through `ProviderPackSource` and `valueOf`, the public API of `@stackra/market-packs`, and never names a
 *           Market or a provider. A list entry is a provider code, or an object with `provider` and `status`; an entry
 *           whose status is not `live` (a `planned` provider) is listed in the pack and never served, and a repeated
 *           provider counts once. "Today" is the UTC date of the clock.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0422 (decision 3); config-model section 3.
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { valueOf } from "@stackra/market-packs";

import { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import type { ProviderPackSource } from "#core/ports/provider-pack-source.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";
import { liveProviderOf } from "#core/functions/live-provider-of.function";

/**
 * A Market's providers for a capability, from its pack.
 *
 * @example
 * const choices = await defaults.providers("sms", "sa"); // [{ provider: "unifonic", connectionId: "conn_…" }]
 */
export class MarketPackProviderDefaultsDriver extends Driver(ProviderDefaults) {
  /** The packs and platform Connections. */
  private readonly packs: ProviderPackSource;

  /** Today's date. */
  private readonly clock: Clock;

  /**
   * @param packs - the host's pack source.
   * @param clock - the container's clock.
   */
  constructor(packs: ProviderPackSource, clock: Clock) {
    super();
    this.packs = packs;
    this.clock = clock;
  }

  /** The live providers the Market pack lists for `capability` in `market`, in its order. */
  async providers(capability: string, market: string): Promise<readonly ProviderChoice[]> {
    const resolved = await this.packs.resolve(market);
    const today = this.clock.now().toISOString().slice(0, 10);
    const listed = valueOf(resolved, `providers.${capability}`, today)?.value;
    if (!Array.isArray(listed)) return [];
    const choices: ProviderChoice[] = [];
    for (const entry of listed) {
      const provider = liveProviderOf(entry);
      if (provider === undefined || choices.some((choice) => choice.provider === provider))
        continue;
      // oxlint-disable-next-line no-await-in-loop -- one lookup per listed provider, in the pack's order
      const connectionId = await this.packs.platformConnection(capability, market, provider);
      choices.push({ provider, ...(connectionId === undefined ? {} : { connectionId }) });
    }
    return choices;
  }
}
