/**
 * Stackra file contract:
 * Purpose: the AWS KMS driver of the `Signer` port (driver name `aws-kms`): ES256 signatures made inside KMS with an
 *          asymmetric `ECC_NIST_P256` key, so the private key never leaves KMS; the public key is read from KMS once
 *          and handed out for offline verification.
 * Boundary: a plain subclass of the port. Managed or bring your own: the key is the environment's managed signing key
 *           or a tenant's own key ARN (a grant to the runtime role); the KMS client signs with the runtime's role and
 *           no credential is configured. The message is hashed here (SHA-256) and KMS signs the digest, so a large
 *           checkpoint never travels to KMS. KMS's DER signature is rewritten as `r || s`. A refused call rejects with
 *           a RangeError naming the key id only.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a KMS-signed checkpoint); ADR 0416; ADR 0188 (decision 2).
 */
import { base64urlEncode } from "#core/functions/base64url-encode.function";
import { derToP1363 } from "#core/functions/der-to-p1363.function";
import { Signer } from "#core/ports/signer.port";
import type { AwsKmsApi } from "#core/types/aws-kms-api.type";
import type { AwsKmsSignerOptions } from "#core/types/aws-kms-signer-options.type";
import type { Signature } from "#core/types/signature.type";
import type { SignerPublicKey } from "#core/types/signer-public-key.type";

/** P-256 integers are 32 bytes. */
const P256_BYTES = 32;

/**
 * Signs inside AWS KMS.
 *
 * @example
 * const signer = new AwsKmsSignerDriver(new KMS({ region }), { kmsKeyId: config.signingKeyId, keyId: "audit-2026" });
 */
export class AwsKmsSignerDriver extends Signer {
  private readonly kms: AwsKmsApi;

  private readonly kmsKeyId: string;

  private readonly keyId: string;

  /** The public key read, or being read. */
  private reading: Promise<SignerPublicKey> | undefined;

  /**
   * @param kms - the KMS client (the SDK's `KMS`, or any `AwsKmsApi`).
   * @param options - the KMS key and the id signatures name.
   * @throws RangeError when the KMS key id is empty.
   */
  constructor(kms: AwsKmsApi, options: AwsKmsSignerOptions) {
    super();
    if (options.kmsKeyId === "") throw new RangeError("AwsKmsSignerDriver needs a KMS key id");
    this.kms = kms;
    this.kmsKeyId = options.kmsKeyId;
    this.keyId = options.keyId ?? options.kmsKeyId;
  }

  /** See `Signer.sign`. */
  async sign(message: Uint8Array): Promise<Signature> {
    const digest = new Uint8Array(
      await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(message)),
    );
    let der: Uint8Array | undefined;
    try {
      ({ Signature: der } = await this.kms.sign({
        KeyId: this.kmsKeyId,
        Message: digest,
        MessageType: "DIGEST",
        SigningAlgorithm: "ECDSA_SHA_256",
      }));
    } catch {
      throw new RangeError(`KMS refused to sign with ${this.keyId}`);
    }
    if (der === undefined) throw new RangeError(`KMS returned no signature for ${this.keyId}`);
    return Object.freeze({
      keyId: this.keyId,
      algorithm: "ES256",
      value: base64urlEncode(derToP1363(der, P256_BYTES)),
    });
  }

  /** See `Signer.publicKey`; read from KMS once. A failed read is not kept. */
  publicKey(): Promise<SignerPublicKey> {
    if (this.reading !== undefined) return this.reading;
    const reading = this.readPublicKey();
    this.reading = reading;
    reading.catch(() => {
      if (this.reading === reading) this.reading = undefined;
    });
    return reading;
  }

  /** One KMS `GetPublicKey`. */
  private async readPublicKey(): Promise<SignerPublicKey> {
    let spki: Uint8Array | undefined;
    try {
      ({ PublicKey: spki } = await this.kms.getPublicKey({ KeyId: this.kmsKeyId }));
    } catch {
      throw new RangeError(`KMS refused the public key of ${this.keyId}`);
    }
    if (spki === undefined || spki.length === 0)
      throw new RangeError(`KMS returned no public key for ${this.keyId}`);
    return Object.freeze({ keyId: this.keyId, algorithm: "ES256", spki: base64urlEncode(spki) });
  }
}
