/**
 * Stackra file contract:
 * Purpose: unit tests of `ServiceApiKeyStoreDriver`: it reads a key's record from the identity service by hash and maps
 *          it; it keeps a verified record for the cache window and asks again after it; an unknown key is never cached;
 *          and a revoke takes effect at once after `evictPrincipal`, or at the window's end without it (the worst case).
 * Boundary: test only; the identity service is a `ClientFake` transport, the clock a settable one, and the revoke flow
 *           runs through the real `ApiKeyVerifierService`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (amendments of 2026-11-09); STA-2646.
 */
import { ClientFake } from "@stackra/clients/testing";
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { ApiKeyMode } from "#contracts/enums/api-key-mode.enum";
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
import { hashApiKey } from "#core/functions/hash-api-key.function";
import { mintApiKey } from "#core/functions/mint-api-key.function";
import { ApiKeyVerifierService } from "#core/services/api-key-verifier.service";
import { VERIFY_API_KEY_QUERY } from "#node/constants/verify-api-key-query.constant";
import { ServiceApiKeyStoreDriver } from "#node/drivers/service-api-key-store.driver";

const PRINCIPAL = "prn_01J9Z3K4M5N6P7Q8R9S0T1V2W3";
const SCOPE_ID = "scp_01J9Z3K4M5N6P7Q8R9S0T1V2W4";

/** A clock the test moves. */
class SettableClock extends Driver(Clock) {
  at = new Date("2026-11-09T10:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }

  advance(seconds: number): void {
    this.at = new Date(this.at.getTime() + seconds * 1000);
  }
}

/** Identity answering a live test key of `PRINCIPAL`. */
function setup() {
  const config = buildConfig(IdentityConfig);
  const identity = new ClientFake();
  identity.on(VERIFY_API_KEY_QUERY).returns({
    keyId: "aki_01J9Z3K4M5N6P7Q8R9S0T1V2W5",
    principalId: PRINCIPAL,
    scopeId: SCOPE_ID,
    keyKind: "secret",
    origins: [],
    scopes: ["payments.payment.read"],
    mode: ApiKeyMode.Test,
    versionPin: "2026-11-09",
  });
  const clock = new SettableClock();
  const store = new ServiceApiKeyStoreDriver(identity, config, clock);
  const verifier = new ApiKeyVerifierService(store, config, clock);
  return { config, identity, clock, store, verifier };
}

describe("ServiceApiKeyStoreDriver", () => {
  it("reads a key's record from identity by its hash and maps it", async () => {
    const { identity, store } = setup();
    const record = await store.findByHash("a".repeat(64));
    expect(record).toMatchObject({
      id: "aki_01J9Z3K4M5N6P7Q8R9S0T1V2W5",
      hash: "a".repeat(64),
      principal: PRINCIPAL,
      scopeId: SCOPE_ID,
      scopes: ["payments.payment.read"],
      mode: ApiKeyMode.Test,
      versionPin: "2026-11-09",
    });
    expect(identity.called(VERIFY_API_KEY_QUERY)).toEqual([{ keyHash: "a".repeat(64) }]);
  });

  it("keeps a verified record for the cache window, then asks again", async () => {
    const { config, identity, clock, store } = setup();
    await store.findByHash("b".repeat(64));
    clock.advance(config.apiKeyCacheSeconds - 1);
    await store.findByHash("b".repeat(64));
    expect(identity.called(VERIFY_API_KEY_QUERY)).toHaveLength(1);
    clock.advance(2);
    await store.findByHash("b".repeat(64));
    expect(identity.called(VERIFY_API_KEY_QUERY)).toHaveLength(2);
  });

  it("never caches a key identity does not know", async () => {
    const { identity, store } = setup();
    identity.on(VERIFY_API_KEY_QUERY).throws(NotFoundError.create());
    expect(await store.findByHash("c".repeat(64))).toBeUndefined();
    expect(await store.findByHash("c".repeat(64))).toBeUndefined();
    expect(identity.called(VERIFY_API_KEY_QUERY)).toHaveLength(2);
  });

  it("refuses a revoked key at once after eviction, and at the window's end without it", async () => {
    const { config, identity, clock, store, verifier } = setup();
    const key = mintApiKey(ApiKeyKind.Secret, config, ApiKeyMode.Test);
    expect(await hashApiKey(key)).toMatch(/^[0-9a-f]{64}$/);
    expect((await verifier.verify(key)).mode).toBe(ApiKeyMode.Test);

    // identity revokes it: the index row is gone
    identity.on(VERIFY_API_KEY_QUERY).throws(NotFoundError.create());
    // without the revoke event the cached record still passes until the window ends (the worst case)
    expect((await verifier.verify(key)).record.principal).toBe(PRINCIPAL);
    // the revoke event reaches this service: the next call asks identity and is refused
    store.evictPrincipal(PRINCIPAL);
    await expect(verifier.verify(key)).rejects.toBeInstanceOf(ApiKeyRejectedError);

    // a second key of the same principal, cached and never evicted, stops at the window's end
    identity.on(VERIFY_API_KEY_QUERY).returns({
      principalId: PRINCIPAL,
      scopeId: SCOPE_ID,
      keyKind: "secret",
      origins: [],
      mode: ApiKeyMode.Test,
    });
    const other = mintApiKey(ApiKeyKind.Secret, config, ApiKeyMode.Test);
    await verifier.verify(other);
    identity.on(VERIFY_API_KEY_QUERY).throws(NotFoundError.create());
    clock.advance(config.apiKeyCacheSeconds + 1);
    await expect(verifier.verify(other)).rejects.toBeInstanceOf(ApiKeyRejectedError);
  });
});
