/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsKmsSignerDriver`: KMS signs the SHA-256 digest, the DER signature becomes `r || s` and
 *          verifies with `verifySignature` against the KMS public key; the public key is read once; refusals name the
 *          key id only; an empty KMS key id is refused.
 * Boundary: test only; a fake KMS signs digests with a Web Crypto P-256 key and returns DER, as KMS does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0212 (decision 3); ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { AwsKmsSignerDriver } from "#core/drivers/aws-kms-signer.driver";
import { verifySignature } from "#core/functions/verify-signature.function";
import { Signer } from "#core/ports/signer.port";
import type { AwsKmsApi } from "#core/types/aws-kms-api.type";

/** A DER INTEGER of the unsigned big-endian `bytes`. */
function derInteger(bytes: Uint8Array): number[] {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start += 1;
  const body = [...bytes.subarray(start)];
  if ((body[0] ?? 0) >= 0x80) body.unshift(0);
  return [0x02, body.length, ...body];
}

/**
 * A fake KMS signer. KMS signs a digest as is; Web Crypto always hashes, so the fake signs the digest's preimage the
 * test registers, which yields the same signature KMS would make over that digest.
 */
class FakeKms implements AwsKmsApi {
  reads = 0;

  refuse = false;

  readonly keys = crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);

  readonly preimages = new Map<string, Uint8Array>();

  async sign(input: { Message: Uint8Array }): Promise<{ Signature?: Uint8Array }> {
    if (this.refuse) throw new Error("AccessDeniedException");
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
    if (this.refuse) throw new Error("AccessDeniedException");
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

describe("AwsKmsSignerDriver", () => {
  it("signs a digest in KMS and verifies offline", async () => {
    const kms = new FakeKms();
    const signer = new AwsKmsSignerDriver(kms, {
      kmsKeyId: "alias/stackra-audit",
      keyId: "audit-2026",
    });
    expect(signer).toBeInstanceOf(Signer);
    const message = new TextEncoder().encode('{"hash":"ab","sequence":7}');
    await kms.expect(message);
    const signature = await signer.sign(message);
    expect(signature.keyId).toBe("audit-2026");
    const [key, again] = await Promise.all([signer.publicKey(), signer.publicKey()]);
    expect(key).toBe(again);
    expect(kms.reads).toBe(1);
    await expect(verifySignature(key, message, signature)).resolves.toBe(true);
  });

  it("names the KMS key when no key id is given, and refusals name the key only", async () => {
    const kms = new FakeKms();
    kms.refuse = true;
    const signer = new AwsKmsSignerDriver(kms, { kmsKeyId: "alias/stackra-audit" });
    await expect(signer.sign(new Uint8Array([1]))).rejects.toThrow(
      "KMS refused to sign with alias/stackra-audit",
    );
    await expect(signer.publicKey()).rejects.toThrow(RangeError);
    kms.refuse = false;
    await expect(signer.publicKey()).resolves.toMatchObject({ keyId: "alias/stackra-audit" });
    expect(() => new AwsKmsSignerDriver(kms, { kmsKeyId: "" })).toThrow(RangeError);
  });
});
