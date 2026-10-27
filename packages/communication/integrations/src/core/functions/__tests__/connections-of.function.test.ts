/**
 * Stackra file contract:
 * Purpose: unit tests of `connectionsOf`: the registered connection classes of a connector kind or a category, keyed
 *          by provider code, nothing for a capability no Integration declares, and a refusal when two Integrations
 *          share a provider code.
 * Boundary: test only; the registry is filled through `registerConnections`, as gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0447 (decision 2); ADR 0355 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";
import { connectionsOf } from "#core/functions/connections-of.function";
import { registerConnections } from "#core/functions/register-connections.function";
import { ConnectedAccount } from "#core/values/connected-account.value";

const BASE = { levels: [ConnectionLevel.Scope], auth: { type: AuthType.None } } as const;

class EcosioIntegration extends Integration({
  ...BASE,
  provider: "ecosio",
  category: IntegrationCategory.Edi,
  roles: [IntegrationRole.Connector],
  connectors: [ConnectorKind.Edi],
}) {}
class EcosioConnection extends Connection<EcosioIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "ecosio" });
  }
}

class TalabatIntegration extends Integration({
  ...BASE,
  provider: "talabat",
  category: IntegrationCategory.FoodDelivery,
  roles: [IntegrationRole.Connector],
  connectors: [ConnectorKind.SalesChannel],
}) {}
class TalabatConnection extends Connection<TalabatIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "talabat" });
  }
}

class OtherTalabatIntegration extends Integration({
  ...BASE,
  provider: "talabat",
  category: IntegrationCategory.FoodDelivery,
}) {}
class OtherTalabatConnection extends Connection<OtherTalabatIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "other" });
  }
}

describe("connectionsOf", () => {
  registerConnections([
    { connection: EcosioConnection, integration: EcosioIntegration, key: "edi.ecosio" },
    { connection: TalabatConnection, integration: TalabatIntegration, key: "channels.talabat" },
  ]);

  it("answers the classes of a connector kind by provider code", () => {
    expect(connectionsOf(ConnectorKind.Edi)).toEqual({ ecosio: EcosioConnection });
    expect(connectionsOf(ConnectorKind.SalesChannel)).toEqual({ talabat: TalabatConnection });
  });

  it("answers the classes of a category", () => {
    expect(connectionsOf(IntegrationCategory.FoodDelivery)).toEqual({ talabat: TalabatConnection });
  });

  it("answers nothing for a capability no Integration declares", () => {
    expect(connectionsOf(ConnectorKind.FraudScoring)).toEqual({});
  });

  it("refuses two Integrations of one provider", () => {
    registerConnections([
      {
        connection: OtherTalabatConnection,
        integration: OtherTalabatIntegration,
        key: "channels.other_talabat",
      },
    ]);
    expect(() => connectionsOf(IntegrationCategory.FoodDelivery)).toThrow(
      /one Integration per provider/,
    );
  });
});
