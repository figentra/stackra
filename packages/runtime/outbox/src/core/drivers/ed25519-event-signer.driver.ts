/**
 * Stackra file contract:
 * Purpose: `Ed25519EventSignerDriver`, the first `EventSigner`: signs `<webhook-id>.<webhook-timestamp>.<body>` with the
 *          producer's Ed25519 private key and names the current key id, `webhook-signature: v1a,<key id>,<base64>`.
 * Boundary: the private key is read by its secret name (`EventsRelayConfig.signingKey`, `STACKRA_EVENTS_SIGNING_KEY` by
 *           default) from the `SecretStore` port the runtime binds (the store behind it is the runtime's, ADR 0525), on
 *           the first signature, and imported as a non-extractable Web Crypto key; its value is never logged, kept as
 *           text or put in an error. The secret holds the PKCS#8 DER key as base64url. The current key is the first of
 *           `keys`. Web Crypto only (Node 24, a Worker), no dependency. STA-1792's workload identity later replaces
 *           this driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 16, amendment of 2026-11-02); ADR 0173 (secrets by name); ADR 0525;
 *                     the Standard Webhooks header layout (research R-4).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { EventsRelayConfig } from "#config/events-relay.config";
import { EventSigner } from "#contracts/index";
import type { SignedHeaders } from "#contracts/index";
import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";

/**
 * Signs deliveries with the producer's Ed25519 key.
 *
 * @example
 * const signer = new Ed25519EventSignerDriver(secrets, buildConfig(EventsRelayConfig, { values: { keys } }));
 * const headers = await signer.sign("dlv_…", now, body);
 */
export class Ed25519EventSignerDriver extends Driver(EventSigner) {
  /** Where the private key is read from, by name. */
  private readonly secrets: SecretStore;

  /** The signing key's secret name and the key ids. */
  private readonly config: EventsRelayConfig;

  /** The imported private key, once read. */
  private key: Promise<CryptoKey> | undefined;

  /**
   * @param secrets - the runtime's secret store.
   * @param config - the producer's `events` block of this environment.
   */
  constructor(secrets: SecretStore, config: EventsRelayConfig) {
    super();
    this.secrets = secrets;
    this.config = config;
  }

  /** Implements `EventSigner.sign`, documented there. */
  async sign(id: string, at: Date, body: string): Promise<SignedHeaders> {
    const keyId = this.config.keys[0]?.id;
    if (keyId === undefined) throw new Error("The events relay lists no signing key id");
    const timestamp = String(Math.floor(at.getTime() / 1000));
    const signature = await crypto.subtle.sign(
      "Ed25519",
      await this.privateKey(),
      new TextEncoder().encode(`${id}.${timestamp}.${body}`),
    );
    return {
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1a,${keyId},${btoa(String.fromCodePoint(...new Uint8Array(signature)))}`,
    };
  }

  /**
   * The private key, imported once; a failed import is forgotten so a later secret can be read.
   *
   * @throws Error naming the secret (never its value) when it is not bound or is no Ed25519 PKCS#8 key.
   */
  private privateKey(): Promise<CryptoKey> {
    this.key ??= this.importKey().catch((error: unknown) => {
      this.key = undefined;
      throw error;
    });
    return this.key;
  }

  /** Reads and imports the private key. */
  private async importKey(): Promise<CryptoKey> {
    const name = this.config.signingKey;
    const secret = this.secrets.get(name);
    if (secret === undefined || secret.trim() === "") throw new Error(`${name} is not bound`);
    const bytes = bytesOfBase64(secret.trim());
    if (bytes === undefined) throw new Error(`${name} is not a base64url PKCS#8 Ed25519 key`);
    try {
      return await crypto.subtle.importKey("pkcs8", bytes, "Ed25519", false, ["sign"]);
    } catch {
      throw new Error(`${name} is not a PKCS#8 Ed25519 key`);
    }
  }
}
