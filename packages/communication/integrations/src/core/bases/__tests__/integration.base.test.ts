/**
 * Stackra file contract:
 * Purpose: unit tests of `Integration`: the template's Resend description declares and records its options with
 *          `roles` and `multiple` defaulted, `@Secret` fields mark an integration, the runtime arrives through `super()` and makes
 *          the `api` once, and every malformed option is refused when the class is declared.
 * Boundary: test only; the runtime is a stand-in whose `client` returns a marker.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 1, 3, 6, 9 and 13); ADR 0305 (rule 2).
 */
import { Secret } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { ConnectorKind } from "#core/enums/connector-kind.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";
import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { IntegrationApi } from "#core/types/integration-api.type";
import type { IntegrationClass } from "#core/types/integration-class.type";
import type { IntegrationOptions } from "#core/types/integration-options.type";

/** The template's description of Resend, with the webhook scheme as its code. */
const RESEND: IntegrationOptions = {
  provider: "resend",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.resend.com",
  rateLimits: [{ requests: 10, per: "1s", by: RateLimitScope.Credential }],
  retry: { idempotencyHeader: "Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
  webhooks: { scheme: "standard_webhooks", secret: "{webhookSecret}", eventType: { path: "type" } },
  listing: { docsUrl: "https://resend.com/docs" },
};

class ResendIntegration extends Integration(RESEND) {
  @Secret("RESEND_API_KEY")
  apiKey!: string;

  @Secret("RESEND_WEBHOOK_SECRET")
  webhookSecret!: string;
}

/** A runtime whose `client` returns `api`. */
function runtimeWith(api: IntegrationApi) {
  const client = vi.fn(() => api);
  return {
    runtime: Object.assign(Object.create(IntegrationRuntime.prototype) as IntegrationRuntime, {
      client,
    }),
    client,
  };
}

/** Declares the Resend description with `options` changed. */
const refuse = (options: Partial<IntegrationOptions>) => () =>
  Integration({ ...RESEND, ...options } as IntegrationOptions);

describe("Integration", () => {
  it("records the description with multiple defaulted", () => {
    expect(kindOf(ResendIntegration)).toEqual({
      kind: "integration",
      options: { ...RESEND, roles: [], multiple: false },
    });
    expect(Secret.members(ResendIntegration)).toEqual(
      new Map([
        ["apiKey", "RESEND_API_KEY"],
        ["webhookSecret", "RESEND_WEBHOOK_SECRET"],
      ]),
    );
  });

  it("gets its runtime through super() and makes the api once", () => {
    const api = {} as IntegrationApi;
    const { runtime, client } = runtimeWith(api);
    const resend = new ResendIntegration(runtime);
    expect(resend.api).toBe(api);
    expect(resend.api).toBe(api);
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenCalledWith(resend);
    expect(resend).toBeInstanceOf(Integration);
  });

  it("explains an api read without a runtime", () => {
    expect(() => new ResendIntegration().api).toThrow(/withIntegrationApi/);
  });

  it("keeps the platform secrets off the instance", () => {
    const resend = new ResendIntegration(runtimeWith({} as IntegrationApi).runtime);
    expect(resend.apiKey).toBeUndefined();
    expect(JSON.stringify(resend)).not.toContain("api");
  });

  it("refuses a malformed description", () => {
    expect(refuse({ provider: "Resend Mail" })).toThrow(/provider/);
    expect(refuse({ category: "mail" as IntegrationOptions["category"] })).toThrow(/category/);
    expect(refuse({ levels: [ConnectionLevel.User, ConnectionLevel.User] })).toThrow(/levels/);
    expect(
      refuse({ auth: { type: AuthType.ApiKey, header: "Authorization", query: "key" } }),
    ).toThrow(/exactly one/);
    expect(refuse({ auth: { type: AuthType.ApiKey } })).toThrow(/exactly one/);
    expect(refuse({ auth: { type: AuthType.Basic, username: "{sid}", password: "" } })).toThrow(
      /Basic/,
    );
    expect(
      refuse({
        levels: [],
        auth: {
          type: AuthType.OAuth2Code,
          authorizeUrl: "https://provider.example/authorize",
          tokenUrl: "https://provider.example/token",
          clientId: "{clientId}",
          scopes: [],
        },
      }),
    ).toThrow(/needs a level/);
    expect(refuse({ baseUrl: "ftp://api.resend.com" })).toThrow(/baseUrl/);
    expect(refuse({ baseUrl: "http://{host}/api" })).toThrow(/baseUrl/);
    expect(refuse({ roles: [IntegrationRole.Driver, IntegrationRole.Driver] })).toThrow(/roles/);
    expect(refuse({ roles: ["oracle" as IntegrationRole] })).toThrow(/roles/);
    expect(refuse({ connectors: [ConnectorKind.SalesChannel] })).toThrow(/connectors/);
    expect(
      refuse({ rateLimits: [{ requests: 0, per: "1s", by: RateLimitScope.Credential }] }),
    ).toThrow(/rateLimits/);
    expect(
      refuse({ rateLimits: [{ requests: 10, per: "0s", by: RateLimitScope.Credential }] }),
    ).toThrow(RangeError);
    expect(refuse({ retry: { attempts: 0 } })).toThrow(/attempts/);
    expect(
      refuse({
        webhooks: { scheme: "standard_webhooks", secret: "", eventType: { path: "type" } },
      }),
    ).toThrow(/webhooks/);
  });

  it("accepts roles, connector kinds and a per-region base URL", () => {
    expect(
      refuse({
        baseUrl: "https://{host}/api",
        roles: [IntegrationRole.Driver, IntegrationRole.Connector],
        connectors: [ConnectorKind.SalesChannel, ConnectorKind.ProductFeed],
      }),
    ).not.toThrow();
  });

  it("accepts a platform-only integration with no level", () => {
    expect(() =>
      Integration({
        provider: "status-page",
        category: IntegrationCategory.Other,
        levels: [],
        auth: { type: AuthType.None },
      }),
    ).not.toThrow();
  });

  it("is called only and returns an integration class", () => {
    expectTypeOf(Integration(RESEND)).toEqualTypeOf<IntegrationClass>();
    expectTypeOf<ResendIntegration["api"]>().toEqualTypeOf<IntegrationApi>();
  });
});
