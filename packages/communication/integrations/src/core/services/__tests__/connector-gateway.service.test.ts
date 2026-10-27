/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectorGateway`: each lookup asks the resolver for its connector kind with the registered
 *          drivers of that kind, a named provider narrows the drivers to it, an unregistered provider is refused before
 *          the resolver runs, and the filter and the Market pass through.
 * Boundary: test only; the resolver is a stand-in that records its calls.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decisions 2 and 3); ADR 0356 (decision 2); STA-793 (`ads`).
 */
import { describe, expect, it } from "@stackra/testing";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";
import { NoProviderError } from "#core/errors/no-provider.error";
import { registerConnections } from "#core/functions/register-connections.function";
import { ConnectorGateway } from "#core/services/connector-gateway.service";
import type { ProviderResolver } from "#core/services/provider-resolver.service";
import { ConnectedAccount } from "#core/values/connected-account.value";

const BASE = {
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  roles: [IntegrationRole.Connector],
} as const;

class ShipBobIntegration extends Integration({
  ...BASE,
  provider: "shipbob",
  category: IntegrationCategory.Shipping,
  connectors: [ConnectorKind.FulfilmentProvider],
}) {}
class ShipBobConnection extends Connection<ShipBobIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "shipbob" });
  }
}

class NoonIntegration extends Integration({
  ...BASE,
  provider: "noon",
  category: IntegrationCategory.Marketing,
  connectors: [ConnectorKind.SalesChannel, ConnectorKind.ProductFeed],
}) {}
class NoonConnection extends Connection<NoonIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "noon" });
  }
}

class AdNetIntegration extends Integration({
  ...BASE,
  provider: "adnet",
  category: IntegrationCategory.Marketing,
  connectors: [ConnectorKind.AdPlatform, ConnectorKind.ProductFeed],
}) {}
class AdNetConnection extends Connection<AdNetIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "adnet" });
  }
}

registerConnections([
  { connection: ShipBobConnection, integration: ShipBobIntegration, key: "fulfilment.shipbob" },
  { connection: NoonConnection, integration: NoonIntegration, key: "channels.noon" },
  { connection: AdNetConnection, integration: AdNetIntegration, key: "ads.adnet" },
]);

/** A filter the gateway passes through untouched. */
const accepts = (): boolean => true;

/** A resolver stand-in that records each call and answers a marker. */
function recordingResolver(): { resolver: ProviderResolver; calls: unknown[][] } {
  const calls: unknown[][] = [];
  const resolver = {
    async resolve(...args: unknown[]) {
      calls.push(args);
      return { resolved: args[0] };
    },
  } as unknown as ProviderResolver;
  return { resolver, calls };
}

describe(ConnectorGateway, () => {
  it("resolves a fulfilment provider by its kind over the registered drivers", async () => {
    const { resolver, calls } = recordingResolver();
    await expect(new ConnectorGateway(resolver).fulfilment()).resolves.toEqual({
      resolved: "fulfilment_provider",
    });
    expect(calls[0]?.slice(0, 2)).toEqual(["fulfilment_provider", { shipbob: ShipBobConnection }]);
  });

  it("narrows to a named provider and passes the filter and the Market", async () => {
    const { resolver, calls } = recordingResolver();
    await new ConnectorGateway(resolver).channel({ provider: "noon", accepts, market: "sa" });
    expect(calls[0]).toEqual(["sales_channel", { noon: NoonConnection }, accepts, "sa"]);
    await new ConnectorGateway(resolver).feed();
    expect(calls[1]?.slice(0, 2)).toEqual([
      "product_feed",
      { noon: NoonConnection, adnet: AdNetConnection },
    ]);
    await new ConnectorGateway(resolver).ads({ provider: "adnet" });
    expect(calls[2]?.slice(0, 2)).toEqual(["ad_platform", { adnet: AdNetConnection }]);
  });

  it("refuses a provider with no registered Connection of the kind", async () => {
    const { resolver, calls } = recordingResolver();
    await expect(new ConnectorGateway(resolver).edi({ provider: "noon" })).rejects.toThrow(
      NoProviderError,
    );
    expect(calls).toEqual([]);
  });
});
