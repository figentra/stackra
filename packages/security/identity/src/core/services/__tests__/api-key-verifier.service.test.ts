/**
 * Stackra file contract:
 * Purpose: unit tests of `ApiKeyVerifierService`: an issued secret key from a server and a publishable key from a
 *          bound origin pass with their record; a malformed key is refused without a lookup; an unknown, revoked or
 *          expired key, a publishable key from an unbound origin and a secret key from a browser are each refused
 *          `api_key_rejected`; an unreachable store throws; a passing key's last use is written only when older than
 *          the configured interval, and a failed write does not refuse the key.
 * Boundary: test only; the memory store, the default identity configuration and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (decisions 3 to 7); COM-56; ADR 0410 (STA-835); STA-1264 (last use).
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { ApiKeyStore } from "#contracts/index";
import type { ApiKeyRecord } from "#contracts/index";
import { MemoryApiKeyStoreDriver } from "#core/drivers/memory-api-key-store.driver";
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
import { hashApiKey } from "#core/functions/hash-api-key.function";
import { mintApiKey } from "#core/functions/mint-api-key.function";
import { ApiKeyVerifierService } from "#core/services/api-key-verifier.service";

const NOW = new Date("2026-10-26T10:00:00.000Z");

/** Always `NOW`. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date(NOW.getTime());
  }
}

/** Counts lookups. */
class CountingStore extends MemoryApiKeyStoreDriver {
  lookups = 0;

  override findByHash(hash: string): Promise<ApiKeyRecord | undefined> {
    this.lookups += 1;
    return super.findByHash(hash);
  }
}

const SHOP = "https://shop.acme.example";

describe(ApiKeyVerifierService, () => {
  const config = buildConfig(IdentityConfig);
  let store: CountingStore;
  let verifier: ApiKeyVerifierService;

  /** Mints a key of `kind`, stores its record with `extra`, and resolves to the key. */
  async function issue(kind: ApiKeyKind, extra: Partial<ApiKeyRecord> = {}): Promise<string> {
    const key = mintApiKey(kind, config);
    store.add({
      id: "key_1",
      hash: await hashApiKey(key),
      principal: "usr_bot",
      tenantId: "ten_1",
      scopes: ["catalogue.product.read"],
      origins: [SHOP],
      ...extra,
    });
    return key;
  }

  beforeEach(() => {
    store = new CountingStore();
    verifier = new ApiKeyVerifierService(store, config, new FixedClockDriver());
  });

  it("passes a live secret key from a server and a publishable key from a bound origin", async () => {
    const secret = await issue(ApiKeyKind.Secret);
    expect(await verifier.verify(secret)).toMatchObject({
      kind: ApiKeyKind.Secret,
      record: { principal: "usr_bot", tenantId: "ten_1" },
    });
    const publishable = await issue(ApiKeyKind.Publishable);
    expect((await verifier.verify(publishable, SHOP)).kind).toBe(ApiKeyKind.Publishable);
  });

  it("refuses a malformed key without a lookup", async () => {
    const key = mintApiKey(ApiKeyKind.Secret, config);
    const tampered = `${key.slice(0, -1)}${key.endsWith("A") ? "B" : "A"}`;
    await expect(verifier.verify(tampered)).rejects.toBeInstanceOf(ApiKeyRejectedError);
    await expect(verifier.verify("not a key")).rejects.toBeInstanceOf(ApiKeyRejectedError);
    expect(store.lookups).toBe(0);
  });

  it("refuses an unknown, revoked or expired key", async () => {
    await expect(verifier.verify(mintApiKey(ApiKeyKind.Secret, config))).rejects.toBeInstanceOf(
      ApiKeyRejectedError,
    );
    const revoked = await issue(ApiKeyKind.Secret, { revokedAt: new Date("2026-10-01") });
    await expect(verifier.verify(revoked)).rejects.toBeInstanceOf(ApiKeyRejectedError);
    const expired = await issue(ApiKeyKind.Secret, { expiresAt: NOW });
    await expect(verifier.verify(expired)).rejects.toBeInstanceOf(ApiKeyRejectedError);
  });

  it("refuses a publishable key from an unbound origin and a secret key from a browser", async () => {
    const publishable = await issue(ApiKeyKind.Publishable);
    await expect(verifier.verify(publishable, "https://evil.example")).rejects.toBeInstanceOf(
      ApiKeyRejectedError,
    );
    await expect(verifier.verify(publishable)).rejects.toBeInstanceOf(ApiKeyRejectedError);
    const secret = await issue(ApiKeyKind.Secret);
    await expect(verifier.verify(secret, SHOP)).rejects.toBeInstanceOf(ApiKeyRejectedError);
  });

  it("records a key's last use only when it is older than the interval", async () => {
    const fresh = await issue(ApiKeyKind.Secret);
    await verifier.verify(fresh);
    expect((await store.findByHash(await hashApiKey(fresh)))?.lastUsedAt).toEqual(NOW);
    const recent = new Date(NOW.getTime() - 30_000);
    const quiet = await issue(ApiKeyKind.Secret, { lastUsedAt: recent });
    await verifier.verify(quiet);
    expect((await store.findByHash(await hashApiKey(quiet)))?.lastUsedAt).toEqual(recent);
    const stale = await issue(ApiKeyKind.Secret, { lastUsedAt: new Date(NOW.getTime() - 61_000) });
    await verifier.verify(stale);
    expect((await store.findByHash(await hashApiKey(stale)))?.lastUsedAt).toEqual(NOW);
  });

  it("passes a valid key when its last use cannot be written", async () => {
    const broken = new (class extends MemoryApiKeyStoreDriver {
      override recordUse(): Promise<void> {
        return Promise.reject(new Error("write failed"));
      }
    })();
    const key = mintApiKey(ApiKeyKind.Secret, config);
    broken.add({
      id: "key_2",
      hash: await hashApiKey(key),
      principal: "usr_bot",
      scopes: [],
      origins: [],
    });
    const lenient = new ApiKeyVerifierService(broken, config, new FixedClockDriver());
    expect((await lenient.verify(key)).record.id).toBe("key_2");
  });

  it("fails, never passes, when the store is down", async () => {
    const down = new (class extends Driver(ApiKeyStore) {
      async findByHash(): Promise<ApiKeyRecord | undefined> {
        throw new Error("store down");
      }
    })();
    const failing = new ApiKeyVerifierService(down, config, new FixedClockDriver());
    await expect(failing.verify(mintApiKey(ApiKeyKind.Secret, config))).rejects.toThrow(
      "store down",
    );
  });
});
