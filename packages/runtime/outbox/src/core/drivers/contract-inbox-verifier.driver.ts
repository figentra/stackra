/**
 * Stackra file contract:
 * Purpose: `ContractInboxVerifierDriver`, the consumer's `InboxVerifier`: a request is verified when its timestamp is
 *          within the replay window and one of its `v1a,<key id>,<signature>` values verifies, over
 *          `<id>.<timestamp>.<body>`, with a key that a pinned producer's contract lists for this environment. The
 *          producer is the one whose listed key verified, never a value from the body.
 * Boundary: reads `PRODUCER_KEYS` (registered by gen from the pinned contracts) and `CrossAppConfig.environment`; never
 *           parses the body. A malformed header, key or signature counts as unverified, never as an error. Imported
 *           public keys are kept per key text. This is the seam STA-1792's workload identity replaces.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11, 16 and 18, amendment of 2026-11-02); ADR 0141 (2026-11-01 note).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { CrossAppConfig } from "#config/cross-app.config";
import { InboxVerifier } from "#contracts/index";
import type { InboxVerdict } from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";
import { PRODUCER_KEYS } from "#core/constants/producer-keys.constant";
import { decodeBase64 } from "#core/functions/decode-base64.function";

/** One signature value of the `webhook-signature` header. */
const SIGNATURE = /^v1a,([a-z0-9][a-z0-9-]*),([A-Za-z0-9+/]+={0,2})$/;

/**
 * Verifies inbox requests against the pinned producers' keys.
 *
 * @example
 * // generated wiring: { port: InboxVerifier, candidates: { contract: ContractInboxVerifierDriver } }
 */
export class ContractInboxVerifierDriver extends Driver(InboxVerifier) {
  /** The environment whose keys count. */
  private readonly config: CrossAppConfig;

  /** Imported public keys, by their base64url text. */
  private readonly imported = new Map<string, Promise<CryptoKey>>();

  /**
   * @param config - the environment this instance runs in.
   */
  constructor(config: CrossAppConfig) {
    super();
    this.config = config;
  }

  /** Implements `InboxVerifier.verify`, documented there. */
  async verify(headers: Headers, body: string, now: Date): Promise<InboxVerdict> {
    const id = headers.get("webhook-id");
    const timestamp = headers.get("webhook-timestamp");
    const signatures = headers.get("webhook-signature");
    if (
      id === null ||
      id === "" ||
      timestamp === null ||
      !/^\d+$/.test(timestamp) ||
      signatures === null
    )
      return { verified: false, reason: "missing_headers" };
    const window = Duration.toMilliseconds(CROSS_APP_DEFAULTS.replayWindow);
    if (Math.abs(now.getTime() - Number(timestamp) * 1000) > window)
      return { verified: false, reason: "stale" };
    const content = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
    let known = false;
    for (const value of signatures.split(" ")) {
      const match = SIGNATURE.exec(value);
      if (match === null) continue;
      const [, keyId = "", signature = ""] = match;
      for (const { producer, publicKey } of this.keysWithId(keyId)) {
        known = true;
        if (await this.verifies(publicKey, signature, content))
          return { verified: true, producer, keyId };
      }
    }
    return { verified: false, reason: known ? "bad_signature" : "unknown_key" };
  }

  /** The pinned producers' keys for this environment whose id is `keyId`. */
  private keysWithId(keyId: string): { producer: string; publicKey: string }[] {
    const found: { producer: string; publicKey: string }[] = [];
    for (const [producer, environments] of PRODUCER_KEYS)
      for (const key of environments[this.config.environment] ?? [])
        if (key.id === keyId) found.push({ producer, publicKey: key.publicKey });
    return found;
  }

  /** Whether `signature` signs `content` under `publicKey`; a malformed key or signature does not. */
  private async verifies(
    publicKey: string,
    signature: string,
    content: Uint8Array<ArrayBuffer>,
  ): Promise<boolean> {
    try {
      let key = this.imported.get(publicKey);
      if (key === undefined) {
        key = crypto.subtle.importKey("raw", decodeBase64(publicKey), { name: "Ed25519" }, false, [
          "verify",
        ]);
        this.imported.set(publicKey, key);
      }
      return await crypto.subtle.verify(
        { name: "Ed25519" },
        await key,
        decodeBase64(signature),
        content,
      );
    } catch {
      this.imported.delete(publicKey);
      return false;
    }
  }
}
