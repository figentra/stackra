/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every symbol the template imports (`AuthType`, `ConnectedAccount`,
 *          `Connection`, `ConnectionCheckFailedError`, `ConnectionLevel`, `ConnectionStore`, `Integration`,
 *          `IntegrationCategory`, `InvalidSignatureError`, `ProviderRefusedError`, `ProviderUnavailableError`,
 *          `RateLimitScope`) and the registry row's runtime are exported, nothing else is, the internals are not, and
 *          the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as integrations from "#core/index";
import type {
  AuthOptions,
  ConnectInput,
  ConnectionRecord,
  IntegrationApi,
  IntegrationOptions,
  OAuthTokens,
  RequestOptions,
} from "#core/index";

describe("@stackra/integrations", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(integrations).sort()).toEqual([
      "AuthType",
      "ChatwootConnection",
      "ChatwootIntegration",
      "ConnectedAccount",
      "Connection",
      "ConnectionAmbiguousError",
      "ConnectionCheckFailedError",
      "ConnectionHost",
      "ConnectionLevel",
      "ConnectionStore",
      "ConnectorKind",
      "HostedConnectionStoreDriver",
      "Integration",
      "IntegrationCategory",
      "IntegrationRole",
      "IntegrationRuntime",
      "InvalidSignatureError",
      "LocalConnectionStoreDriver",
      "MarketPackProviderDefaultsDriver",
      "MANAGED_PROVISIONING_TEMPLATES",
      "MemoryManagedProvisioningDriver",
      "NoProviderError",
      "PROVIDER_CATALOGUE_SEEDS",
      "PROVIDER_CATEGORY_SEEDS",
      "Pass",
      "ProviderPackSource",
      "ProviderRefusedError",
      "ProviderResolver",
      "ProviderUnavailableError",
      "RateLimitScope",
      "RequestConnectionContextDriver",
      "UnbalancedJournalError",
      "assertBalanced",
      "assertPayInputs",
      "credentialRef",
      "postJournal",
      "recordingPlan",
      "registerConnections",
      "resolvePlaceholders",
    ]);
    expect("managedClient" in integrations).toBe(false);
    expect("CONNECTION_REGISTRY" in integrations).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<AuthOptions["type"]>().toEqualTypeOf<integrations.AuthType>();
    expectTypeOf<IntegrationOptions["levels"]>().toEqualTypeOf<
      readonly integrations.ConnectionLevel[]
    >();
    expectTypeOf<IntegrationApi>().toHaveProperty("post");
    expectTypeOf<RequestOptions["idempotencyKey"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<OAuthTokens["accessToken"]>().toEqualTypeOf<string>();
    expectTypeOf<ConnectionRecord["id"]>().toEqualTypeOf<`conn_${string}`>();
    expectTypeOf<ConnectInput<integrations.Connection>["tokens"]>().toEqualTypeOf<
      OAuthTokens | undefined
    >();
  });
});
