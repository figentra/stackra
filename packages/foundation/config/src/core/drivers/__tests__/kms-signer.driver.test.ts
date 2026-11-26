/**
 * Stackra file contract:
 * Purpose: unit tests of `KmsSignerDriver`: a `Signer` that signs through the bound `KmsClient` with the configured
 *          KMS key, whose signatures verify against the KMS public key, read once; the key id defaults to the KMS key
 *          id; an empty KMS key is refused on first use, not at construction.
 * Boundary: test only; a fake `KmsClient` signs digests with a Web Crypto P-256 key and returns DER, as KMS does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0212 (decision 3); ADR 0416.
 */
import { Driver } from "@stackra/container";
import { Signer, verifySignature } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SignerConfig } from "#config/signer.config";
import { KmsClient } from "#contracts/ports/kms-client.port";
import { KmsSignerDriver } from "#core/drivers/kms-signer.driver";
import { buildConfig } from "#core/functions/build-config.function";

/** A DER INTEGER of the unsigned big-endian `bytes`. */
function derInteger(bytes: Uint8Array): number[] {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start += 1;
  const body = [...bytes.subarray(start)];
  if ((body[0] ?? 0) >= 0x80) body.unshift(0);
  return [0x02, body.length, ...body];
}

/**
 * A fake KMS. KMS signs a digest as is; Web Crypto always hashes, so the fake signs the digest's preimage the test
 * registers, which yields the signature KMS would make over that digest.
 */
class FakeKmsClient extends Driver(KmsClient) {
  readonly keys = crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);

  readonly preimages = new Map<string, Uint8Array>();

  readonly signedWith: string[] = [];

  reads = 0;

  async sign(input: { KeyId: string; Message: Uint8Array }): Promise<{ Signature?: Uint8Array }> {
    this.signedWith.push(input.KeyId);
    const preimage = this.preimages.get([...input.Message].join(","));
    if (preimage === undefined) throw new Error("unknown digest");
    const raw = new Uint8Array(
      await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        (await this.keys).privateKey,
        new Uint8Array(preimage),
      ),
    );
    const body = [...derInteger(raw.subarray(0, 32)), ...derInteger(raw.subarray(32))];
    return { Signature: new Uint8Array([0x30, body.length, ...body]) };
  }

  async getPublicKey(): Promise<{ PublicKey?: Uint8Array }> {
    this.reads += 1;
    return {
      PublicKey: new Uint8Array(await crypto.subtle.exportKey("spki", (await this.keys).publicKey)),
    };
  }

  async decrypt(): Promise<{ Plaintext?: Uint8Array }> {
    throw new Error("not used");
  }

  async generateDataKeyWithoutPlaintext(): Promise<{ CiphertextBlob?: Uint8Array }> {
    throw new Error("not used");
  }

  /** Registers `message` so a sign of its digest can be answered. */
  async expect(message: Uint8Array): Promise<void> {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(message)));
    this.preimages.set([...digest].join(","), message);
  }
}

const MESSAGE = new TextEncoder().encode("usage report 2026-11");

describe("KmsSignerDriver", () => {
  it("signs through the bound client with the configured key, verifiable against the KMS public key", async () => {
    const kms = new FakeKmsClient();
    await kms.expect(MESSAGE);
    const config = buildConfig(SignerConfig, {
      values: { kmsKeyId: "alias/usage-signing", keyId: "usage-2026" },
    });
    const signer = new KmsSignerDriver(config, kms);
    expect(signer).toBeInstanceOf(Signer);
    const signature = await signer.sign(MESSAGE);
    expect(signature).toMatchObject({ keyId: "usage-2026", algorithm: "ES256" });
    expect(kms.signedWith).toEqual(["alias/usage-signing"]);
    const key = await signer.publicKey();
    await signer.publicKey();
    expect(kms.reads).toBe(1);
    await expect(verifySignature(key, MESSAGE, signature)).resolves.toBe(true);
  });

  it("names its signatures by the KMS key id when the config names no key id", async () => {
    const kms = new FakeKmsClient();
    await kms.expect(MESSAGE);
    const config = buildConfig(SignerConfig, { values: { kmsKeyId: "alias/usage-signing" } });
    expect((await new KmsSignerDriver(config, kms).sign(MESSAGE)).keyId).toBe(
      "alias/usage-signing",
    );
  });

  it("is built with no KMS key, and refuses on first use", async () => {
    const signer = new KmsSignerDriver(
      buildConfig(SignerConfig, { values: {} }),
      new FakeKmsClient(),
    );
    await expect(signer.sign(MESSAGE)).rejects.toBeInstanceOf(RangeError);
    await expect(signer.publicKey()).rejects.toBeInstanceOf(RangeError);
  });
});
