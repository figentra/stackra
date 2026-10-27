/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionTaxProviderDriver`: a `rates` Market is taxed from its table with no resolver call;
 *          a `provider` Market goes to the resolved `tax` Connection and the quote's source names provider and
 *          Connection; `record` and `void` reach the same Connection; a table quote records nothing; a foreign id is
 *          refused. The request and gateway answers stand in for a recorded provider exchange.
 * Boundary: test only; the resolver is an in-memory stand-in and the Connection a plain class, so no store and no
 *           provider is reached.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0379 (decisions 2, 3 and 5).
 */
import { Rounding } from "@stackra/contracts";
import type { ProviderDrivers, ProviderResolver } from "@stackra/integrations";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { TaxGateway } from "#contracts/types/tax-gateway.type";
import type { TaxQuote } from "#contracts/types/tax-quote.type";
import type { TaxRequest } from "#contracts/types/tax-request.type";
import { ConnectionTaxProviderDriver } from "#core/drivers/connection-tax-provider.driver";
import type { TaxRateTable } from "#core/types/tax-rate-table.type";

const sale: TaxRequest = {
  currency: "USD",
  at: new Date("2026-10-25"),
  destination: { country: "US", region: "NY", postalCode: "10001" },
  pricesIncludeTax: false,
  lines: [{ id: "l1", amount: Money.of("100.00", "USD"), taxClass: "standard" }],
};

/** A tax Connection whose provider answers as its recorded exchange did, and what it was asked. */
class FakeTaxConnection implements TaxGateway {
  readonly id = "conn_1";

  readonly asked: string[] = [];

  async quote(request: TaxRequest): Promise<TaxQuote> {
    this.asked.push(`quote ${request.destination.region}`);
    const tax = Money.of("8.88", "USD");
    return {
      lines: [{ id: "l1", tax, rate: "0.08875", jurisdiction: "us-ny" }],
      total: tax,
      source: "taxcalc_1",
    };
  }

  async record(quote: TaxQuote, reference: string): Promise<string> {
    this.asked.push(`record ${quote.source} ${reference}`);
    return "tax_txn_1";
  }

  async void(transaction: string): Promise<void> {
    this.asked.push(`void ${transaction}`);
  }
}

/** The driver over `table` (null: the Market's engine is `provider`), and what the resolver was asked. */
function setup(table: TaxRateTable | null) {
  const connection = new FakeTaxConnection();
  const asked: string[] = [];
  const drivers = { "stripe-tax": FakeTaxConnection } as unknown as ProviderDrivers<TaxGateway>;
  const resolver = {
    async resolve(capability: string) {
      asked.push(`resolve ${capability}`);
      return connection;
    },
    async byConnection(_drivers: object, provider: string, connectionId: string) {
      asked.push(`byConnection ${provider} ${connectionId}`);
      return connection;
    },
  } as unknown as ProviderResolver;
  const driver = new (class extends ConnectionTaxProviderDriver {
    protected override readonly drivers = drivers;

    protected override readonly tables = { table: async () => table };
  })(resolver);
  return { driver, asked, connection };
}

describe("ConnectionTaxProviderDriver", () => {
  it("taxes a rates Market from its own table without a provider", async () => {
    const { driver, asked } = setup({
      source: "us@1.0.0",
      rounding: Rounding.HalfUp,
      rates: [{ jurisdiction: "us-ny", taxClass: "standard", rate: "0.08875" }],
    });
    const quote = await driver.quote(sale);
    expect(quote.total.toDecimal()).toBe("8.88");
    expect(quote.source).toBe("us@1.0.0");
    expect(await driver.record(quote, "inv_1")).toBeNull();
    expect(asked).toEqual([]);
  });

  it("taxes a provider Market through the resolved tax Connection", async () => {
    const { driver, asked, connection } = setup(null);
    const quote = await driver.quote(sale);
    expect(quote.source).toBe("stripe-tax:conn_1:taxcalc_1");
    expect(quote.total.toDecimal()).toBe("8.88");
    expect(asked).toEqual(["resolve tax"]);
    expect(connection.asked).toEqual(["quote NY"]);
  });

  it("records and voids at the Connection that quoted", async () => {
    const { driver, asked, connection } = setup(null);
    const transaction = await driver.record(await driver.quote(sale), "inv_42");
    expect(transaction).toBe("stripe-tax:conn_1:tax_txn_1");
    await driver.void(transaction ?? "");
    expect(connection.asked).toEqual(["quote NY", "record taxcalc_1 inv_42", "void tax_txn_1"]);
    expect(asked).toContain("byConnection stripe-tax conn_1");
  });

  it("refuses to void an id it did not answer", async () => {
    const { driver } = setup(null);
    await expect(driver.void("tax_txn_1")).rejects.toThrow(RangeError);
    await expect(driver.void("avalara:conn_1:tax_txn_1")).rejects.toThrow(RangeError);
  });
});
