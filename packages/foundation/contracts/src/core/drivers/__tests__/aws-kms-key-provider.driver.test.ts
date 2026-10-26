/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsKmsKeyProviderDriver` with `wrapTenantKey`: a key wrapped for a tenant unwraps for that
 *          tenant only, the last key is current, an earlier one opens by id, concurrent callers share one KMS call, a
 *          refused unwrap is not cached, and bad options are refused; sealed fields round-trip through the cipher.
 * Boundary: test only; a fake KMS wraps with AES-GCM under a test master key, binding the encryption context as
 *           additional data, the way KMS refuses a wrong context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0188 (decision 2); ADR 0415.
 */
import { describe, expect, it } from "@stackra/testing";

import { AesGcmFieldCipherDriver } from "#core/drivers/aes-gcm-field-cipher.driver";
import { AwsKmsKeyProviderDriver } from "#core/drivers/aws-kms-key-provider.driver";
import { wrapTenantKey } from "#core/functions/wrap-tenant-key.function";
import { KeyProvider } from "#core/ports/key-provider.port";
import type { AwsKmsApi } from "#core/types/aws-kms-api.type";

/** A fake KMS: AES-GCM under one master key, the context as additional data. */
class FakeKms implements AwsKmsApi {
  decrypts = 0;

  refuse = false;

  private readonly master = crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);

  private static aad(context: Record<string, string> | undefined): Uint8Array<ArrayBuffer> {
    return new TextEncoder().encode(JSON.stringify(Object.entries(context ?? {}).sort()));
  }

  async generateDataKeyWithoutPlaintext(input: {
    KeyId: string;
    EncryptionContext?: Record<string, string>;
  }): Promise<{ CiphertextBlob?: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: FakeKms.aad(input.EncryptionContext) },
      await this.master,
      crypto.getRandomValues(new Uint8Array(32)),
    );
    return { CiphertextBlob: new Uint8Array([...iv, ...new Uint8Array(sealed)]) };
  }

  async decrypt(input: {
    CiphertextBlob: Uint8Array;
    EncryptionContext?: Record<string, string>;
  }): Promise<{ Plaintext?: Uint8Array }> {
    this.decrypts += 1;
    if (this.refuse) throw new Error("AccessDeniedException");
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(input.CiphertextBlob.subarray(0, 12)),
        additionalData: FakeKms.aad(input.EncryptionContext),
      },
      await this.master,
      new Uint8Array(input.CiphertextBlob.subarray(12)),
    );
    return { Plaintext: new Uint8Array(plain) };
  }

  async sign(): Promise<{ Signature?: Uint8Array }> {
    throw new Error("not used");
  }

  async getPublicKey(): Promise<{ PublicKey?: Uint8Array }> {
    throw new Error("not used");
  }
}

describe("AwsKmsKeyProviderDriver", () => {
  it("serves the tenant's keys, the last current, and seals fields with them", async () => {
    const kms = new FakeKms();
    const keys = [
      await wrapTenantKey(kms, "alias/stackra-data", "ten_a", "k1"),
      await wrapTenantKey(kms, "alias/stackra-data", "ten_a", "k2"),
    ];
    const provider = new AwsKmsKeyProviderDriver(kms, {
      kmsKeyId: "alias/stackra-data",
      tenantId: "ten_a",
      keys,
    });
    expect(provider).toBeInstanceOf(KeyProvider);
    expect((await provider.current()).id).toBe("k2");
    expect((await provider.byId("k1")).key).toHaveLength(32);
    const cipher = new AesGcmFieldCipherDriver(provider);
    expect(await cipher.open(await cipher.seal("canary", "c"), "c")).toBe("canary");
  });

  it("refuses a key wrapped for another tenant", async () => {
    const kms = new FakeKms();
    const wrapped = await wrapTenantKey(kms, "alias/stackra-data", "ten_a", "k1");
    const provider = new AwsKmsKeyProviderDriver(kms, {
      kmsKeyId: "alias/stackra-data",
      tenantId: "ten_b",
      keys: [wrapped],
    });
    await expect(provider.current()).rejects.toThrow("KMS refused to unwrap data key k1");
  });

  it("shares one unwrap between callers and retries after a refusal", async () => {
    const kms = new FakeKms();
    const provider = new AwsKmsKeyProviderDriver(kms, {
      kmsKeyId: "alias/stackra-data",
      tenantId: "ten_a",
      keys: [await wrapTenantKey(kms, "alias/stackra-data", "ten_a", "k1")],
    });
    kms.refuse = true;
    await expect(provider.current()).rejects.toThrow(RangeError);
    kms.refuse = false;
    const [one, two] = await Promise.all([provider.current(), provider.byId("k1")]);
    expect(one).toBe(two);
    expect(kms.decrypts).toBe(2);
    await expect(provider.byId("k9")).rejects.toThrow("No data key has the id k9");
  });

  it("refuses empty, malformed or repeated keys and empty ids", async () => {
    const kms = new FakeKms();
    const key = { id: "k1", wrapped: "AAAA" };
    const options = { kmsKeyId: "alias/stackra-data", tenantId: "ten_a", keys: [key] };
    expect(() => new AwsKmsKeyProviderDriver(kms, { ...options, keys: [] })).toThrow(RangeError);
    expect(() => new AwsKmsKeyProviderDriver(kms, { ...options, keys: [key, key] })).toThrow(
      RangeError,
    );
    expect(
      () =>
        new AwsKmsKeyProviderDriver(kms, { ...options, keys: [{ id: "a.b", wrapped: "AAAA" }] }),
    ).toThrow(RangeError);
    expect(() => new AwsKmsKeyProviderDriver(kms, { ...options, tenantId: "" })).toThrow(
      RangeError,
    );
    await expect(wrapTenantKey(kms, "alias/stackra-data", "ten_a", "a.b")).rejects.toThrow(
      RangeError,
    );
  });
});
