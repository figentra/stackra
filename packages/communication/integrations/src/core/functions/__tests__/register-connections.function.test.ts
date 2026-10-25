/**
 * Stackra file contract:
 * Purpose: unit tests of `registerConnections`: an entry links a connection class to its Integration and key, a second
 *          registration of the same entry changes nothing, and a wrong class, an Integration without levels, an empty
 *          key or a second connection class for one Integration are refused.
 * Boundary: test only; the registry is read back through the internal `registrationOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 2); ADR 0305 (rule 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { registerConnections } from "#core/functions/register-connections.function";
import { registrationOf } from "#core/functions/registration-of.function";
import type { ConnectionClass } from "#core/types/connection-class.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

class MailIntegration extends Integration({
  provider: "mail",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
}) {}

class PlatformOnlyIntegration extends Integration({
  provider: "platform-only",
  category: IntegrationCategory.Other,
  levels: [],
  auth: { type: AuthType.None },
}) {}

class MailConnection extends Connection<MailIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "mail" });
  }
}

class OtherMailConnection extends Connection<MailIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "other" });
  }
}

describe("registerConnections", () => {
  it("links a connection class to its Integration and key, once", () => {
    const entry = {
      connection: MailConnection,
      integration: MailIntegration,
      key: "messages.mail",
    };
    registerConnections([entry]);
    registerConnections([entry]);
    expect(registrationOf(MailConnection)).toEqual(entry);
  });

  it("refuses a second connection class for one Integration", () => {
    expect(() =>
      registerConnections([
        { connection: OtherMailConnection, integration: MailIntegration, key: "messages.mail" },
      ]),
    ).toThrow(/keep one connection class per integration/);
  });

  it("refuses a class that is not a connection, an Integration without levels and an empty key", () => {
    expect(() =>
      registerConnections([
        {
          connection: class {} as unknown as ConnectionClass,
          integration: MailIntegration,
          key: "messages.mail",
        },
      ]),
    ).toThrow(TypeError);
    expect(() =>
      registerConnections([
        { connection: OtherMailConnection, integration: PlatformOnlyIntegration, key: "x.y" },
      ]),
    ).toThrow(/declares no levels/);
    expect(() =>
      registerConnections([
        { connection: OtherMailConnection, integration: MailIntegration, key: "" },
      ]),
    ).toThrow(TypeError);
  });

  it("says how to fix an unregistered class", () => {
    expect(() => registrationOf(OtherMailConnection)).toThrow(/registerConnections/);
  });
});
