/**
 * Stackra file contract:
 * Purpose: unit tests of `ProviderResolver` (the ADR 0356 conformance cases): the tenant's own Connection wins; with
 *          none, the Market's platform Connection serves; a provider with no driver is skipped; `accepts` filters;
 *          no Market tries only the tenant's own; nothing fitting refuses; a stored connection or credential reference
 *          reloads the exact Connection.
 * Boundary: test only; the store, the defaults and the Market are in-memory stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decisions 2 to 5, enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { MarketContext } from "#contracts/ports/market-context.port";
import { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";
import { Connection } from "#core/bases/connection.base";
import { NoProviderError } from "#core/errors/no-provider.error";
import { ConnectionStore } from "#core/ports/connection-store.port";
import { ProviderResolver } from "#core/services/provider-resolver.service";
import type { ConnectionClass } from "#core/types/connection-class.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

/** A sender connection whose id says whose it is. */
abstract class Sender extends Connection {
  abstract readonly label: string;
  abstract readonly fast: boolean;
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: this.label });
  }
}
class AlphaConnection extends Sender {
  label = "alpha";
  fast = true;
}
class BetaConnection extends Sender {
  label = "beta";
  fast = true;
}

const DRIVERS = { alpha: AlphaConnection, beta: BetaConnection } as const;

/** A store holding the tenant's own connections and the platform's by id. */
class Store extends ConnectionStore {
  private readonly own: Map<ConnectionClass, Connection>;
  private readonly platform: Map<string, Connection>;
  constructor(own: Map<ConnectionClass, Connection>, platform: Map<string, Connection>) {
    super();
    this.own = own;
    this.platform = platform;
  }
  async find<C extends Connection>(type: ConnectionClass<C>): Promise<C | null> {
    return (this.own.get(type as ConnectionClass) as C | undefined) ?? null;
  }
  async byId<C extends Connection>(_type: ConnectionClass<C>, id: string): Promise<C> {
    const found = this.platform.get(id);
    if (found === undefined) throw new Error(`no ${id}`);
    return found as C;
  }
  async list<C extends Connection>(): Promise<C[]> {
    return [];
  }
  async connect<C extends Connection>(): Promise<C> {
    throw new Error("unused");
  }
  async disconnect(): Promise<void> {}
}

class Defaults extends ProviderDefaults {
  private readonly choices: readonly ProviderChoice[];
  constructor(choices: readonly ProviderChoice[]) {
    super();
    this.choices = choices;
  }
  async providers(): Promise<readonly ProviderChoice[]> {
    return this.choices;
  }
}

class Market extends MarketContext {
  private readonly code: string | undefined;
  constructor(code: string | undefined) {
    super();
    this.code = code;
  }
  market(): string | undefined {
    return this.code;
  }
}

const alphaPlatform = Object.assign(Object.create(AlphaConnection.prototype), {
  label: "alpha-platform",
  fast: true,
});
const betaPlatform = Object.assign(Object.create(BetaConnection.prototype), {
  label: "beta-platform",
  fast: false,
});
const betaTenant = Object.assign(Object.create(BetaConnection.prototype), {
  label: "beta-tenant",
  fast: true,
});

const resolverWith = (
  own: [ConnectionClass, Connection][],
  choices: readonly ProviderChoice[],
  market: string | undefined = "sa",
) =>
  new ProviderResolver(
    new Store(
      new Map(own),
      new Map([
        ["conn_a", alphaPlatform],
        ["conn_b", betaPlatform],
      ]),
    ),
    new Defaults(choices),
    new Market(market),
  );

const OFFER: readonly ProviderChoice[] = [
  { provider: "gamma", connectionId: "conn_g" },
  { provider: "alpha", connectionId: "conn_a" },
  { provider: "beta", connectionId: "conn_b" },
];

describe("ProviderResolver", () => {
  it("prefers the tenant's own Connection", async () => {
    const resolver = resolverWith([[BetaConnection, betaTenant]], OFFER);
    await expect(resolver.resolve<Sender>("sms", DRIVERS)).resolves.toBe(betaTenant);
  });

  it("falls back to the Market's platform Connection, skipping unknown providers", async () => {
    await expect(resolverWith([], OFFER).resolve<Sender>("sms", DRIVERS)).resolves.toBe(
      alphaPlatform,
    );
  });

  it("filters with accepts", async () => {
    const resolver = resolverWith([], [{ provider: "beta", connectionId: "conn_b" }]);
    await expect(resolver.resolve<Sender>("sms", DRIVERS, (c) => c.fast)).rejects.toThrow(
      NoProviderError,
    );
  });

  it("tries only the tenant's own without a Market", async () => {
    await expect(
      resolverWith([[BetaConnection, betaTenant]], [], undefined).resolve<Sender>("sms", DRIVERS),
    ).resolves.toBe(betaTenant);
    await expect(
      resolverWith([], OFFER, undefined).resolve<Sender>("sms", DRIVERS),
    ).rejects.toMatchObject({
      code: "no_provider",
      details: { capability: "sms" },
    });
  });

  it("reloads a stored connection or credential reference", async () => {
    const resolver = resolverWith([], OFFER);
    await expect(resolver.byConnection<Sender>(DRIVERS, "beta", "conn_b")).resolves.toBe(
      betaPlatform,
    );
    await expect(resolver.byRef<Sender>(DRIVERS, "alpha:conn_a")).resolves.toBe(alphaPlatform);
    await expect(resolver.byConnection<Sender>(DRIVERS, "gamma", "conn_g")).rejects.toThrow(
      NoProviderError,
    );
  });
});
