/**
 * Stackra file contract:
 * Purpose: `Ed25519EventSignerDriver`, the producer's `EventSigner`: signs `<id>.<timestamp>.<body>` with the
 *          producer's own Ed25519 key and answers the Standard Webhooks headers, `webhook-id`, `webhook-timestamp` and
 *          `webhook-signature: v1a,<key id>,<base64 signature>`.
 * Boundary: the private key comes from `CrossAppConfig.signingKey` (base64url PKCS #8, a `@Secret` read from the secret
 *           store) and is imported once, not extractable, and never logged. Without a key or key id it refuses with
 *           `CrossAppKeyMissingError`, which the relay records and retries. Web Crypto only, no dependency.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 16, amendment of 2026-11-02); ADR 0173.
 */
import { Driver } from "@stackra/container";

import type { CrossAppConfig } from "#config/cross-app.config";
import { EventSigner } from "#contracts/index";
import { CrossAppKeyMissingError } from "#core/errors/cross-app-key-missing.error";
import { decodeBase64 } from "#core/functions/decode-base64.function";
import { encodeBase64 } from "#core/functions/encode-base64.function";

/**
 * Signs deliveries with the producer's Ed25519 key.
 *
 * @example
 * // generated wiring: { port: EventSigner, candidates: { ed25519: Ed25519EventSignerDriver } }
 */
export class Ed25519EventSignerDriver extends Driver(EventSigner) {
  /** The key and its id. */
  private readonly config: CrossAppConfig;

  /** The imported private key, once. */
  private key: Promise<CryptoKey> | undefined;

  /**
   * @param config - the key id and the signing key.
   */
  constructor(config: CrossAppConfig) {
    super();
    this.config = config;
  }

  /** Implements `EventSigner.sign`, documented there. */
  async sign(id: string, at: Date, body: string): Promise<Readonly<Record<string, string>>> {
    if (this.config.signingKey === "" || this.config.keyId === "")
      throw CrossAppKeyMissingError.create({});
    const timestamp = String(Math.floor(at.getTime() / 1000));
    this.key ??= crypto.subtle.importKey(
      "pkcs8",
      decodeBase64(this.config.signingKey),
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      { name: "Ed25519" },
      await this.key,
      new TextEncoder().encode(`${id}.${timestamp}.${body}`),
    );
    return Object.freeze({
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1a,${this.config.keyId},${encodeBase64(new Uint8Array(signature))}`,
    });
  }
}
