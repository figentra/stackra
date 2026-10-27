/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every symbol the template imports (`AuthType`, `ConnectedAccount`,
 *          `Connection`, `ConnectionCheckFailedError`, `ConnectionLevel`, `ConnectionStore`, `Integration`,
 *          `IntegrationCategory`, `InvalidSignatureError`, `ProviderRefusedError`, `ProviderUnavailableError`,
 *          `RateLimitScope`) and the registry row's runtime, the hosted store's client driver and
 *          `requestToken` are exported, nothing else is, the internals are not, and
 *          the public types resolve, `PassBase` (type only) and the webhook scheme recipe (`WebhookSchemeRecipe`,
 *          `IntegrationWebhooks["recipe"]`, STA-1357) among them.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as integrations from "#core/index";
import type {
  AuthOptions,
  ConnectInput,
  ConnectionHostCalls,
  ConnectionRecord,
  IntegrationApi,
  IntegrationOptions,
  IntegrationWebhooks,
  OAuthTokens,
  PassBase,
  RequestOptions,
  TokenRequest,
  WebhookSchemeRecipe,
} from "#core/index";

describe("@stackra/integrations", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(integrations).sort()).toEqual([
      "AuthType",
      "ClientConnectionHostDriver",
      "ConnectedAccount",
      "Connection",
      "ConnectionAmbiguousError",
      "ConnectionCheckFailedError",
      "ConnectionHost",
      "ConnectionLevel",
      "ConnectionStore",
      "ConnectorGateway",
      "ConnectorKind",
      "EDI_MESSAGE_CODES",
      "HostedConnectionStoreDriver",
      "Integration",
      "IntegrationCategory",
      "IntegrationRole",
      "IntegrationRuntime",
      "InvalidSignatureError",
      "LocalConnectionStoreDriver",
      "MANAGED_PROVISIONING_TEMPLATES",
      "MailboxEdiConnector",
      "MalformedEdiError",
      "MarketPackProviderDefaultsDriver",
      "MemoryAudioDeviceDriver",
      "MemoryConnectionStoreDriver",
      "MemoryEdiMailbox",
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
      "RegionMapProviderDefaultsDriver",
      "RequestConnectionContextDriver",
      "SpeechService",
      "UnbalancedJournalError",
      "UnmappedAccountError",
      "VOICE_METERS",
      "VoiceMeter",
      "VoicePack",
      "assertBalanced",
      "assertPayInputs",
      "audioSeconds",
      "connectionsOf",
      "consentSteps",
      "credentialRef",
      "functionalAcknowledgement",
      "handoverSteps",
      "mapJournal",
      "matchKeysOf",
      "postJournal",
      "postMappedJournal",
      "readInterchange",
      "recordingPlan",
      "registerConnections",
      "requestToken",
      "resolvePlaceholders",
      "writeInterchange",
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
    expectTypeOf<ConnectInput<integrations.Connection>["credentialsExpireAt"]>().toEqualTypeOf<
      Date | undefined
    >();
    expectTypeOf<TokenRequest["url"]>().toEqualTypeOf<string>();
    expectTypeOf<ConnectionHostCalls>().toHaveProperty("token");
    expectTypeOf<IntegrationWebhooks["recipe"]>().toEqualTypeOf<WebhookSchemeRecipe | undefined>();
    expectTypeOf<keyof WebhookSchemeRecipe>().toEqualTypeOf<
      "header" | "query" | "path" | "fields" | "decimals" | "algorithm" | "ivHeader" | "tagHeader"
    >();
    expectTypeOf<WebhookSchemeRecipe["algorithm"]>().toEqualTypeOf<
      "SHA-256" | "SHA-512" | undefined
    >();
    // `Pass({ key })` returns a class of `PassBase`, so a consumer's declaration emit can name its base (STA-1220).
    expectTypeOf<InstanceType<ReturnType<typeof integrations.Pass>>>().toEqualTypeOf<PassBase>();
  });
});
