/**
 * Stackra file contract:
 * Purpose: `MarketPackPaymentDefaultsDriver`, the production `MarketPaymentDefaults`: the providers a Market offers,
 *          read from its market pack's `payments.byo-providers` list in force today, live entries only, in the pack's
 *          order, each with the platform Connection the deployment runs for it (none for a provider only a tenant's
 *          own account serves).
 * Boundary: the driver named `market-pack`. It reads the pack through `PaymentPackSource` and `valueOf`, the public API
 *           of `@stackra/market-packs`, and never names a Market or a provider. A list entry is a provider code, or an
 *           object with `provider` and `status`; an entry whose status is not `live` (a `planned` gateway) is listed in
 *           the pack and never served. "Today" is the UTC date of the clock.
 * Runtime: node
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); R4-4; STA-666 (production binding).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { valueOf } from "@stackra/market-packs";

import { MarketPaymentDefaults } from "#contracts/ports/market-payment-defaults.port";
import type { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";

/** The pack key that lists a Market's payment providers. */
const PROVIDERS_KEY = "payments.byo-providers";

/** The provider code of a live list entry, or undefined. */
function liveProviderOf(entry: unknown): string | undefined {
  if (typeof entry === "string") return entry === "" ? undefined : entry;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return undefined;
  const provider: unknown = Reflect.get(entry, "provider");
  const status: unknown = Reflect.get(entry, "status");
  if (typeof provider !== "string" || provider === "") return undefined;
  return status === undefined || status === "live" ? provider : undefined;
}

/**
 * The Market's providers, from its pack.
 *
 * @example
 * const choices = await defaults.providers("eu"); // [{ provider: "stripe", connectionId: "conn_…" }]
 */
export class MarketPackPaymentDefaultsDriver extends Driver(MarketPaymentDefaults) {
  /** The packs and platform Connections. */
  private readonly packs: PaymentPackSource;

  /** Today's date. */
  private readonly clock: Clock;

  /**
   * @param packs - the host's pack source.
   * @param clock - the container's clock.
   */
  constructor(packs: PaymentPackSource, clock: Clock) {
    super();
    this.packs = packs;
    this.clock = clock;
  }

  /** The providers the Market's pack offers, in order. */
  async providers(market: string): Promise<readonly ProviderChoice[]> {
    const resolved = await this.packs.resolve(market);
    const today = this.clock.now().toISOString().slice(0, 10);
    const listed = valueOf(resolved, PROVIDERS_KEY, today)?.value;
    if (!Array.isArray(listed)) return [];
    const choices: ProviderChoice[] = [];
    for (const entry of listed) {
      const provider = liveProviderOf(entry);
      if (provider === undefined || choices.some((choice) => choice.provider === provider))
        continue;
      // oxlint-disable-next-line no-await-in-loop -- one lookup per listed provider, in the pack's order
      const connectionId = await this.packs.platformConnection(market, provider);
      choices.push({ provider, ...(connectionId === undefined ? {} : { connectionId }) });
    }
    return choices;
  }
}
