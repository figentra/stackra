/**
 * Stackra file contract:
 * Purpose: the memory driver of the `Signer` port (driver name `memory`): an ECDSA P-256 key pair held in process,
 *          for tests, local development and a tool that signs with a key it was handed.
 * Boundary: a plain subclass of the port (this package sits below @stackra/container). `generate` makes a
 *           non-extractable private key, so the private half can never be exported from it. Production signing uses
 *           the `aws-kms` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0416; ADR 0266 (memory first).
 */
import { base64urlEncode } from "#core/functions/base64url-encode.function";
import { Signer } from "#core/ports/signer.port";
import type { Signature } from "#core/types/signature.type";
import type { SignerKeyPair } from "#core/types/signer-key-pair.type";
import type { SignerPublicKey } from "#core/types/signer-public-key.type";

/** The Web Crypto algorithm of ES256. */
const ES256 = { name: "ECDSA", namedCurve: "P-256" } as const;

/**
 * Signs with an in-process key pair.
 *
 * @example
 * const signer = await MemorySignerDriver.generate("audit-dev");
 * const signature = await signer.sign(bytes);
 */
export class MemorySignerDriver extends Signer {
  private readonly keyId: string;

  private readonly keys: SignerKeyPair;

  /**
   * @param keyId - the id written into each signature.
   * @param keys - an ECDSA P-256 key pair whose public key is extractable.
   * @throws RangeError when the id is empty.
   */
  constructor(keyId: string, keys: SignerKeyPair) {
    super();
    if (keyId === "") throw new RangeError("MemorySignerDriver needs a key id");
    this.keyId = keyId;
    this.keys = keys;
  }

  /** A signer over a fresh key pair whose private key cannot be exported. */
  static async generate(keyId: string): Promise<MemorySignerDriver> {
    const keys = await globalThis.crypto.subtle.generateKey(ES256, false, ["sign", "verify"]);
    return new MemorySignerDriver(keyId, keys);
  }

  /** A detached ES256 signature of `message`. */
  async sign(message: Uint8Array): Promise<Signature> {
    const value = await globalThis.crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      this.keys.privateKey,
      new Uint8Array(message),
    );
    return Object.freeze({
      keyId: this.keyId,
      algorithm: "ES256",
      value: base64urlEncode(new Uint8Array(value)),
    });
  }

  /** The public key a verifier checks this signer's signatures with. */
  async publicKey(): Promise<SignerPublicKey> {
    const spki = await globalThis.crypto.subtle.exportKey("spki", this.keys.publicKey);
    return Object.freeze({
      keyId: this.keyId,
      algorithm: "ES256",
      spki: base64urlEncode(new Uint8Array(spki)),
    });
  }
}
