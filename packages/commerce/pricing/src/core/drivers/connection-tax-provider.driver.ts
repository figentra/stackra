/**
 * Stackra file contract:
 * Purpose: `ConnectionTaxProviderDriver`, the production `connection` driver of `TaxProvider` (ADR 0379 decisions 2
 *          and 3): a Market whose pack engine is `rates` is taxed by `taxByRates` over its own table with no network
 *          call; a Market whose engine is `provider` is taxed by the `TaxGateway` Connection `ProviderResolver` picks
 *          under the `tax` capability (the scope's own account first, else the Market's managed one, Stripe Tax for
 *          `us` by pack data). `record` and `void` reach the same Connection again for a finalised sale.
 * Boundary: names no vendor: the connection class per provider code (`drivers`) and the pack reader (`tables`) are
 *           declared by the host's subclass of this abstract driver (its constructor takes class tokens only, ADR 0294
 *           rule 17), and the Stripe
 *           Tax, Avalara and TaxJar Connections are OS integrations code (ADR 0443 decision 7). A provider quote's
 *           `source` and a recorded transaction id are `<provider>:<connectionId>:<provider's id>`, so the stored
 *           quote names the account that computed it (decision 5). A quote from a table records nothing (null).
 * Runtime: isomorphic
 * Governing contract: ADR 0379 (decisions 2, 3, 5 and 6, amendment 2026-10-26); ADR 0356 (decisions 2 to 4); ADR 0443
 *                     (decision 8); ADR 0266.
 */
import { Driver } from "@stackra/container";
import type { Connection, ProviderDrivers, ProviderResolver } from "@stackra/integrations";

import { TaxProvider } from "#contracts/ports/tax-provider.port";
import type { TaxGateway } from "#contracts/types/tax-gateway.type";
import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";
import { taxByRates } from "#core/functions/tax-by-rates.function";
import type { TaxTables } from "#core/types/tax-tables.type";

/** The capability code `ProviderDefaults` lists tax providers under (`market-pack:<code>.providers.tax`). */
const CAPABILITY = "tax";

/**
 * Tax by the Market's own table or its provider's Connection.
 *
 * @example
 * // TAX_CONNECTIONS: the host's provider code to Connection class map, from OS integrations
 * export class OsTaxProviderDriver extends ConnectionTaxProviderDriver {
 *   protected override readonly drivers = TAX_CONNECTIONS;
 *   protected override readonly tables = packTaxTables;
 * }
 * const tax = new OsTaxProviderDriver(resolver);
 * const quote = await tax.quote(request); // quote.source "stripe-tax:conn_…:taxcalc_…" in `us`, "sa@2.3.0" in `sa`
 * const transaction = await tax.record(quote, "inv_42");
 */
export abstract class ConnectionTaxProviderDriver extends Driver(TaxProvider) {
  /** The connection class per provider code (each key its Integration's `provider`), declared by the host. */
  protected abstract readonly drivers: ProviderDrivers<TaxGateway>;

  /** The Market's engine and own table, from pack data (null when its engine is `provider`), declared by the host. */
  protected abstract readonly tables: TaxTables;

  /** Picks the provider. */
  private readonly resolver: ProviderResolver;

  /**
   * @param resolver - the integrations provider resolver.
   */
  constructor(resolver: ProviderResolver) {
    super();
    this.resolver = resolver;
  }

  /**
   * The tax of every line, from the Market's table or its provider.
   *
   * @throws RangeError when a line has no rate; NoProviderError when the engine is `provider` and none serves.
   */
  async quote(request: TaxRequest): Promise<TaxQuote> {
    const table = await this.tables.table(request);
    if (table !== null) return taxByRates(request, table);
    const connection = await this.resolver.resolve(CAPABILITY, this.drivers);
    const provider =
      Object.entries(this.drivers).find(([, type]) => connection instanceof type)?.[0] ?? "";
    const quote = await connection.quote(request);
    return { ...quote, source: `${provider}:${connection.id}:${quote.source}` };
  }

  /**
   * Records the finalised sale `quote` at the provider that computed it.
   *
   * @returns `<provider>:<connectionId>:<transaction>`, or null when the quote came from a table or the provider keeps
   *          no transactions.
   */
  async record(quote: TaxQuote, reference: string): Promise<string | null> {
    const opened = await this.open(quote.source);
    if (opened?.connection.record === undefined) return null;
    const transaction = await opened.connection.record({ ...quote, source: opened.id }, reference);
    return `${opened.provider}:${opened.connection.id}:${transaction}`;
  }

  /**
   * Voids a transaction `record` answered.
   *
   * @throws RangeError when `transaction` is not one this driver answered.
   */
  async void(transaction: string): Promise<void> {
    const opened = await this.open(transaction);
    if (opened === null)
      throw new RangeError(
        `ConnectionTaxProviderDriver: "${transaction}" is not a provider transaction`,
      );
    await opened.connection.void?.(opened.id);
  }

  /** The Connection a prefixed id names and the provider's own id; null when no provider of `drivers` is named. */
  private async open(prefixed: string): Promise<{
    provider: string;
    connection: Connection & TaxGateway;
    id: string;
  } | null> {
    const [provider = "", connectionId = "", ...rest] = prefixed.split(":");
    const id = rest.join(":");
    if (id === "" || connectionId === "" || !Object.hasOwn(this.drivers, provider)) return null;
    const connection = await this.resolver.byConnection(this.drivers, provider, connectionId);
    return { provider, connection, id };
  }
}
