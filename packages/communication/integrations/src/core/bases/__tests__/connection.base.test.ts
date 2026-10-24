/**
 * Stackra file contract:
 * Purpose: unit tests of `Connection`: a subclass is of kind `connection` and may carry `@Secret` fields, `id` and
 *          `api` are what its store attached and explain themselves when no store loaded it, its secret fields never
 *          enumerate, and `ConnectionFields` keeps only the declared fields.
 * Boundary: test only; the connection is loaded with the internal `hydrateConnection`, as a store does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 2, 3 and 13).
 */
import { Secret } from "@stackra/config";
import { kindOf } from "@stackra/container";
import type { Email } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import type { ConnectionFields } from "#core/types/connection-fields.type";
import type { IntegrationApi } from "#core/types/integration-api.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

class MailIntegration extends Integration({
  provider: "mail",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://mail.example",
}) {}

class MailConnection extends Connection<MailIntegration> {
  @Secret("MAIL_TENANT_API_KEY")
  apiKey!: string;

  fromAddress!: Email;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: this.fromAddress });
  }
}

describe("Connection", () => {
  it("is a connection kind that may carry @Secret fields", () => {
    expect(kindOf(MailConnection)?.kind).toBe("connection");
    expect(Secret.members(MailConnection).get("apiKey")).toBe("MAIL_TENANT_API_KEY");
  });

  it("reads the id and client its store attached, and hides its secrets", async () => {
    const api = {} as IntegrationApi;
    const connection = hydrateConnection(
      MailConnection,
      {
        id: "conn_00000000000000000000000001",
        fields: { fromAddress: "orders@acme.example" },
        secrets: { apiKey: "mk_test" },
      },
      () => api,
    );
    expect(connection.id).toBe("conn_00000000000000000000000001");
    expect(connection.api).toBe(api);
    expect(connection.apiKey).toBe("mk_test");
    expect(Object.keys(connection)).not.toContain("apiKey");
    expect(JSON.stringify(connection)).not.toContain("mk_test");
    await expect(connection.check()).resolves.toMatchObject({ id: "orders@acme.example" });
  });

  it("explains an instance no store loaded", () => {
    const connection = new MailConnection();
    expect(() => connection.id).toThrow(/ConnectionStore/);
    expect(() => connection.api).toThrow(/makeConnection/);
  });

  it("types its fields and its partner", () => {
    expectTypeOf<ConnectionFields<MailConnection>>().toEqualTypeOf<{
      apiKey: string;
      fromAddress: Email;
    }>();
    expectTypeOf<MailConnection["~integration"]>().toEqualTypeOf<MailIntegration | undefined>();
  });
});
