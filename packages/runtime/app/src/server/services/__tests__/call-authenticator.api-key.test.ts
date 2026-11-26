/**
 * Stackra file contract:
 * Purpose: unit tests of `CallAuthenticator` for an API key: a live secret key from a server is its principal as an
 *          `api_client` actor in its tenant, with the key as the call's credential (scopes, kind, version pin) and
 *          origin, out of the sandbox; a test publishable key from its bound origin runs in the sandbox; an unknown
 *          key, a secret key from a browser and a key beside a forwarded user token are each one
 *          `BearerTokenInvalidError` that names no part of the key; with no `ApiKeyVerifierService` bound every key is
 *          refused; a key store that cannot be reached throws its own error.
 * Boundary: test only; a map container with the verifier over the memory key store, the default identity
 *           configuration and a fixed clock, and the bearer settings from the environment for the token path.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (as amended: the gateway path, STA-2646 B3); ADR 0098.
 */
import { CallOriginKind } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver, type Named, type NamedToken, type Token } from "@stackra/container";
import { ActorKind, Clock, type Port } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import {
  ApiKeyKind,
  ApiKeyVerifierService,
  hashApiKey,
  IdentityConfig,
  MemoryApiKeyStoreDriver,
  mintApiKey,
} from "@stackra/identity";
import { ApiKeyMode } from "@stackra/identity/contracts";
import type { ApiKeyRecord } from "@stackra/identity/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BearerConfig } from "#config/bearer.config";
import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { CallAuthenticator } from "#server/services/call-authenticator.service";
import type { CallAuthData } from "#server/types/call-auth-data.type";
import type { CallCredentials } from "#server/types/call-credentials.type";

const NOW = new Date("2026-11-09T10:00:00.000Z");
const PRINCIPAL = "prn_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w4";
const SHOP = "https://shop.acme.example";

/** Always `NOW`. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date(NOW);
  }
}

/** The call's container, holding only the values bound here. */
class Bound {
  readonly values: Map<Token, object>;

  constructor(values: readonly (readonly [Token, object])[]) {
    this.values = new Map(values);
  }

  has(token: Token): boolean {
    return this.values.has(token);
  }

  get<T extends object>(token: AnyClass<T>): T;

  get<P extends Port, N extends string>(token: NamedToken<P, N>): Named<P, N>;

  get(token: Token): object {
    const value = this.values.get(token);
    if (value === undefined) throw new Error("not bound in this test");
    return value;
  }
}

/** A key store that cannot be reached. */
class DownStore extends MemoryApiKeyStoreDriver {
  override findByHash(): Promise<ApiKeyRecord | undefined> {
    return Promise.reject(new Error("store down"));
  }
}

const identity = buildConfig(IdentityConfig);
let store: MemoryApiKeyStoreDriver;

/** Mints a key of `kind` and `mode` and stores its record. */
async function issue(kind: ApiKeyKind, mode: ApiKeyMode): Promise<string> {
  const key = mintApiKey(kind, identity, mode);
  store.add({
    id: `aki_${kind}_${mode}`,
    hash: await hashApiKey(key),
    principal: PRINCIPAL,
    scopeId: SCOPE_ID,
    scopes: ["catalogue.product.read"],
    origins: [SHOP],
    mode,
    versionPin: "2026-11-09",
  });
  return key;
}

/** Authenticates `credentials` over a container holding the verifier over `keys`, unless `verifier` is false. */
function authenticate(
  credentials: CallCredentials,
  { verifier = true, keys = store }: { verifier?: boolean; keys?: MemoryApiKeyStoreDriver } = {},
): Promise<CallAuthData> {
  const bound = new Bound([
    [BearerConfig, buildConfig(BearerConfig)],
    [JsonWebKeys, new MemoryJsonWebKeysDriver()],
    [IdentityConfig, identity],
  ]);
  if (verifier)
    bound.values.set(
      ApiKeyVerifierService,
      new ApiKeyVerifierService(keys, identity, new FixedClockDriver()),
    );
  return new CallAuthenticator(bound).authenticate(credentials);
}

/** Expects one refusal that names no part of `key`. */
async function refuses(
  credentials: CallCredentials,
  key: string,
  options?: Parameters<typeof authenticate>[1],
): Promise<void> {
  const refusal = await authenticate(credentials, options).then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(isRefusal(refusal, BearerTokenInvalidError)).toBe(true);
  expect(JSON.stringify(refusal) + String((refusal as Error).message)).not.toContain(key);
}

describe("CallAuthenticator for an API key", () => {
  beforeEach(() => {
    vi.stubEnv("STACKRA_BEARER_ISSUER", "https://auth.example.test");
    vi.stubEnv("STACKRA_BEARER_AUDIENCE", "project-1");
    store = new MemoryApiKeyStoreDriver();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs a live secret key as its principal, with the key as credential and origin, out of the sandbox", async () => {
    const key = await issue(ApiKeyKind.Secret, ApiKeyMode.Live);

    expect(await authenticate({ authorization: `Bearer ${key}` })).toEqual({
      userID: PRINCIPAL,
      actor: { kind: ActorKind.ApiClient, id: PRINCIPAL, scopeId: SCOPE_ID },
      call: {
        credential: {
          kind: "api_key",
          id: "aki_secret_live",
          scopes: ["catalogue.product.read"],
          publishable: false,
          versionPin: "2026-11-09",
        },
        origin: { kind: CallOriginKind.ApiKey, id: "aki_secret_live" },
        sandbox: false,
      },
    });
  });

  it("runs a test publishable key from its bound origin in the sandbox", async () => {
    const key = await issue(ApiKeyKind.Publishable, ApiKeyMode.Test);

    expect(await authenticate({ authorization: `Bearer ${key}`, origin: SHOP })).toMatchObject({
      actor: { kind: ActorKind.ApiClient, id: PRINCIPAL },
      call: { credential: { publishable: true }, sandbox: true },
    });
  });

  it("refuses an unknown key, a secret key from a browser and a key beside a forwarded token", async () => {
    const unknown = mintApiKey(ApiKeyKind.Secret, identity, ApiKeyMode.Live);
    await refuses({ authorization: `Bearer ${unknown}` }, unknown);
    const secret = await issue(ApiKeyKind.Secret, ApiKeyMode.Live);
    await refuses({ authorization: `Bearer ${secret}`, origin: SHOP }, secret);
    await refuses({ authorization: `Bearer ${secret}`, onBehalfOf: "a.forwarded.token" }, secret);
  });

  it("refuses every key when no verifier is bound", async () => {
    const key = await issue(ApiKeyKind.Secret, ApiKeyMode.Live);
    await refuses({ authorization: `Bearer ${key}` }, key, { verifier: false });
  });

  it("lets an unreachable key store fail as an outage, not a refusal", async () => {
    const key = mintApiKey(ApiKeyKind.Secret, identity, ApiKeyMode.Live);
    await expect(
      authenticate({ authorization: `Bearer ${key}` }, { keys: new DownStore() }),
    ).rejects.toThrow("store down");
  });
});
