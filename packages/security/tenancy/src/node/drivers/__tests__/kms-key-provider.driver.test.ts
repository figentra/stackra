/**
 * Stackra file contract:
 * Purpose: unit tests of `KmsKeyProviderDriver` over a stand-in KMS that binds a wrapped key to its encryption context,
 *          as AWS KMS does: a tenant's first seal mints `k1` once (concurrent seals included) and the cache serves it
 *          after; a rotation makes `k2` current while `k1` still opens; two tenants get their own keys, and a wrapped key
 *          copied to another tenant never unwraps there; a platform call and an empty KMS key are refused; no key
 *          reaches a refusal's message.
 * Boundary: test only; the store is the memory driver, the tenant the `ACTIVE_TENANT` storage `withTenant` sets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (decision 2 and its 2026-11-09 amendment); ADR 0173.
 */
import { buildConfig } from "@stackra/config";
import type { KmsClient } from "@stackra/config/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantKeysConfig } from "#config/tenant-keys.config";
import { MemoryTenantDataKeyStoreDriver } from "#core/drivers/memory-tenant-data-key-store.driver";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { KmsKeyProviderDriver } from "#node/drivers/kms-key-provider.driver";

const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1" as PublicId<"scp">;
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1" as PublicId<"scp">;

/** A stand-in KMS: a wrapped key is an id it remembers with the context it was minted under, and opens only there. */
function fakeKms() {
  const minted = new Map<string, { context: string; key: Uint8Array }>();
  const calls = { generate: 0, decrypt: 0 };
  const kms = {
    generateDataKeyWithoutPlaintext: async (input: {
      EncryptionContext?: Record<string, string>;
    }) => {
      calls.generate += 1;
      const handle = `w${minted.size + 1}`;
      minted.set(handle, {
        context: JSON.stringify(input.EncryptionContext),
        key: crypto.getRandomValues(new Uint8Array(32)),
      });
      return { CiphertextBlob: new TextEncoder().encode(handle) };
    },
    decrypt: async (input: {
      CiphertextBlob: Uint8Array;
      EncryptionContext?: Record<string, string>;
    }) => {
      calls.decrypt += 1;
      const held = minted.get(new TextDecoder().decode(input.CiphertextBlob));
      if (held === undefined || held.context !== JSON.stringify(input.EncryptionContext))
        throw new Error("InvalidCiphertextException");
      return { Plaintext: held.key };
    },
  } as unknown as KmsClient;
  return { kms, calls };
}

/** A driver over a fresh stand-in KMS and memory store. */
function setup(kmsKeyId = "alias/tenant-data-keys") {
  const { kms, calls } = fakeKms();
  const store = new MemoryTenantDataKeyStoreDriver();
  const config = buildConfig(TenantKeysConfig, { values: { driver: "kms", kmsKeyId } });
  return { keys: new KmsKeyProviderDriver(config, kms, store), store, calls, kms, config };
}

/** Runs `work` as `tenant`'s call, as `withTenant` does. */
const as = <T>(tenant: PublicId<"scp">, work: () => Promise<T>): Promise<T> =>
  ACTIVE_TENANT.run(tenant, work);

describe(KmsKeyProviderDriver, () => {
  it("mints a tenant's first key once on its first seal and serves it from the cache after", async () => {
    const { keys, store, calls } = setup();
    const [first, second] = await as(TENANT_A, () => Promise.all([keys.current(), keys.current()]));
    expect(first?.id).toBe("k1");
    expect(first?.key).toHaveLength(32);
    expect(second?.key).toEqual(first?.key);
    expect(await as(TENANT_A, () => keys.byId("k1"))).toEqual(first);
    expect(calls.generate).toBe(1);
    expect(calls.decrypt).toBe(1);
    expect((await as(TENANT_A, () => store.list(TENANT_A))).map((key) => key.id)).toEqual(["k1"]);
  });

  it("makes k2 current on rotation while k1 still opens its data", async () => {
    const { keys } = setup();
    const k1 = await as(TENANT_A, () => keys.current());
    const k2 = await as(TENANT_A, () => keys.rotate());
    expect(k2.id).toBe("k2");
    expect(k2.key).not.toEqual(k1.key);
    expect(await as(TENANT_A, () => keys.current())).toEqual(k2);
    expect(await as(TENANT_A, () => keys.byId("k1"))).toEqual(k1);
  });

  it("gives each tenant its own key, and never unwraps a key copied to another tenant", async () => {
    const { keys, store, kms, config } = setup();
    const a = await as(TENANT_A, () => keys.current());
    const b = await as(TENANT_B, () => keys.current());
    expect(b.id).toBe("k1");
    expect(b.key).not.toEqual(a.key);
    // a tenant B row carrying tenant A's ciphertext, under B's next id: KMS refuses the context
    const [stolen] = await as(TENANT_A, () => store.list(TENANT_A));
    await store.add(TENANT_B, { id: "k2", wrapped: stolen?.wrapped ?? "" });
    // a fresh driver, so tenant B's cached keys do not hide the copied row
    const fresh = new KmsKeyProviderDriver(config, kms, store);
    const refused = await as(TENANT_B, () => fresh.byId("k2")).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(RangeError);
    expect((refused as Error).message).toBe("KMS refused to unwrap data key k2");
  });

  it("refuses a platform call and an empty KMS key", async () => {
    const { keys } = setup();
    await expect(keys.current()).rejects.toThrow(/needs a tenant call/);
    const { keys: unkeyed } = setup("");
    await expect(as(TENANT_A, () => unkeyed.current())).rejects.toThrow(/kmsKeyId is empty/);
  });
});
