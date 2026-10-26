/**
 * Stackra file contract:
 * Purpose: unit tests of `ProviderResolver` (the ADR 0356 conformance cases): the tenant's own Connection wins; with
 *          none, the Market's platform Connection serves; a provider with no driver is skipped; `accepts` filters;
 *          no Market tries only the tenant's own; nothing fitting refuses; a stored connection or credential reference
 *          reloads the exact Connection; `candidates` answers the ordered failover list (own first, then managed,
 *          each in the Market's order, a repeated provider once, a BYO-only provider own only) with the mode per
 *          entry; a Market passed as an argument wins over the running call's; `pin` keeps one mode only (platform
 *          verification pinned to managed never reaches the tenant's own Connection).
 * Boundary: test only; the store, the defaults and the Market are in-memory stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decisions 2 to 5, enforcement); ADR 0422 (decision 3); ADR 0376
 *                     (decision 1, verification Note).
 */
import { describe, expect, it } from "@stackra/testing";

import { ProviderMode } from "#contracts/enums/provider-mode.enum";
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
  readonly asked: string[] = [];
  constructor(choices: readonly ProviderChoice[]) {
    super();
    this.choices = choices;
  }
  async providers(_capability: string, market: string): Promise<readonly ProviderChoice[]> {
    this.asked.push(market);
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

  it("answers the failover list, own first then managed, with the mode of each", async () => {
    const alphaTenant = Object.assign(Object.create(AlphaConnection.prototype), {
      label: "alpha-tenant",
      fast: true,
    });
    const resolver = resolverWith(
      [
        [BetaConnection, betaTenant],
        [AlphaConnection, alphaTenant],
      ],
      [...OFFER, { provider: "alpha", connectionId: "conn_a" }],
    );
    const list = await resolver.candidates<Sender>("sms", DRIVERS);
    expect(
      list.map(({ provider, mode, connection }) => [provider, mode, connection.label]),
    ).toEqual([
      ["alpha", ProviderMode.Own, "alpha-tenant"],
      ["beta", ProviderMode.Own, "beta-tenant"],
      ["alpha", ProviderMode.Managed, "alpha-platform"],
      ["beta", ProviderMode.Managed, "beta-platform"],
    ]);
    const fast = await resolver.candidates<Sender>("sms", DRIVERS, { accepts: (c) => c.fast });
    expect(fast.map(({ connection }) => connection.label)).toEqual([
      "alpha-tenant",
      "beta-tenant",
      "alpha-platform",
    ]);
  });

  it("offers a BYO-only provider through the tenant's own Connection only", async () => {
    const resolver = resolverWith([[BetaConnection, betaTenant]], [{ provider: "beta" }]);
    const list = await resolver.candidates<Sender>("sms", DRIVERS);
    expect(list.map(({ mode, connection }) => [mode, connection])).toEqual([
      [ProviderMode.Own, betaTenant],
    ]);
    await expect(
      resolverWith([], [{ provider: "beta" }]).candidates("sms", DRIVERS),
    ).resolves.toEqual([]);
  });

  it("takes the Market as an argument over the running call's", async () => {
    const defaults = new Defaults(OFFER);
    const resolver = new ProviderResolver(
      new Store(new Map(), new Map([["conn_a", alphaPlatform]])),
      defaults,
      new Market(undefined),
    );
    await expect(resolver.resolve<Sender>("sms", DRIVERS, undefined, "ae")).resolves.toBe(
      alphaPlatform,
    );
    await resolver.candidates("sms", DRIVERS, { market: "eg" });
    expect(defaults.asked).toEqual(["ae", "eg"]);
    await expect(resolver.resolve<Sender>("sms", DRIVERS, () => false, "ae")).rejects.toMatchObject(
      {
        details: { capability: "sms", market: "ae" },
      },
    );
  });

  it("stops at the first accepted Connection when resolving one", async () => {
    // conn_b is unknown to this store, so loading it would throw; resolve never gets that far.
    const resolver = new ProviderResolver(
      new Store(new Map(), new Map([["conn_a", alphaPlatform]])),
      new Defaults(OFFER),
      new Market("sa"),
    );
    await expect(resolver.resolve<Sender>("sms", DRIVERS)).resolves.toBe(alphaPlatform);
  });

  it("pins the list to one mode", async () => {
    const resolver = resolverWith(
      [[BetaConnection, betaTenant]],
      [
        { provider: "alpha", connectionId: "conn_a" },
        { provider: "beta", connectionId: "conn_b" },
      ],
    );
    const managed = await resolver.candidates<Sender>("verification", DRIVERS, {
      pin: ProviderMode.Managed,
    });
    expect(managed.map((c) => c.connection)).toEqual([alphaPlatform, betaPlatform]);
    expect(managed.every((c) => c.mode === ProviderMode.Managed)).toBe(true);
    const own = await resolver.candidates<Sender>("verification", DRIVERS, {
      pin: ProviderMode.Own,
    });
    expect(own.map((c) => c.connection)).toEqual([betaTenant]);
  });
});
