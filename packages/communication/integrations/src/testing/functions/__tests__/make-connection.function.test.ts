/**
 * Stackra file contract:
 * Purpose: unit tests of `makeConnection`, through the template's own case: a Resend-shaped connection's `check()`
 *          passes on a verified sender domain, refuses an unverified one with `sender_domain_unverified`, and passes a
 *          sending-only key on the 401 `restricted_api_key` the fake throws; its secret fields never enumerate.
 * Boundary: test only; the connection runs over `fakeIntegrationApi`, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0308 (rules 2 and 14).
 */
import { Secret } from "@stackra/config";
import type { Email } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionCheckFailedError,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  ProviderRefusedError,
} from "#core/index";
import { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";
import { makeConnection } from "#testing/functions/make-connection.function";

class ResendIntegration extends Integration({
  provider: "resend",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.resend.com",
}) {}

/** The domain list Resend answers. */
interface ResendDomainList {
  readonly data: readonly { readonly name: string; readonly status: string }[];
}

class ResendConnection extends Connection<ResendIntegration> {
  @Secret("RESEND_TENANT_API_KEY")
  apiKey!: string;

  @Secret("RESEND_TENANT_WEBHOOK_SECRET")
  webhookSecret!: string;

  fromAddress!: Email;

  async check(): Promise<ConnectedAccount> {
    const domain = this.fromAddress.slice(this.fromAddress.lastIndexOf("@") + 1);
    try {
      const domains = await this.api.get<ResendDomainList>("/domains");
      const own = domains.data.find((candidate) => candidate.name === domain);
      if (own?.status !== "verified")
        throw ConnectionCheckFailedError.create({ reason: "sender_domain_unverified" });
    } catch (error) {
      if (!ProviderRefusedError.is(error, { status: 401, code: "restricted_api_key" })) throw error;
    }
    return ConnectedAccount.create({ id: domain, label: domain });
  }
}

/** A connection sending from `orders@shop.acme.example` over the given domain-list answer. */
function connectionWith(domains: () => unknown) {
  const api = fakeIntegrationApi(ResendIntegration, (fake) =>
    fake.get("/domains").returns(domains),
  );
  return makeConnection(ResendConnection, {
    api,
    fields: {
      apiKey: "re_test_key",
      fromAddress: "orders@shop.acme.example",
      webhookSecret: "test-tenant-signing-secret",
    },
  });
}

describe("makeConnection", () => {
  it("passes and names the verified sender domain", async () => {
    const connection = connectionWith(() => ({
      data: [{ name: "shop.acme.example", status: "verified" }],
    }));
    await expect(connection.check()).resolves.toMatchObject({
      id: "shop.acme.example",
      label: "shop.acme.example",
    });
  });

  it("refuses an unverified sender domain", async () => {
    const connection = connectionWith(() => ({
      data: [{ name: "shop.acme.example", status: "pending" }],
    }));
    await expect(connection.check()).rejects.toMatchObject({ reason: "sender_domain_unverified" });
  });

  it("passes a sending-only key on the sender domain alone", async () => {
    const connection = connectionWith(() => {
      throw ProviderRefusedError.create({ status: 401, code: "restricted_api_key" });
    });
    await expect(connection.check()).resolves.toMatchObject({ id: "shop.acme.example" });
  });

  it("builds the connection as a store loads it", () => {
    const connection = connectionWith(() => ({ data: [] }));
    expect(connection.id).toBe("conn_00000000000000000000000000");
    expect(connection.apiKey).toBe("re_test_key");
    expect({ ...connection }).toEqual({ fromAddress: "orders@shop.acme.example" });
  });
});
