/**
 * Stackra file contract:
 * Purpose: `ContractInboxVerifierDriver`, the first `InboxVerifier`: accepts a request only when its three signature headers
 *          are well formed, its timestamp is within five minutes of this clock either way, its key id is listed for the
 *          running environment by a producer this consumer pins, and the Ed25519 signature over
 *          `<webhook-id>.<webhook-timestamp>.<raw body>` verifies with that key. The verified producer is that key's
 *          service.
 * Boundary: the key table and the running environment are the injected `RelayInboxConfig`'s (gen emits the table
 *           from the pinned contracts' manifest `relay.keys`). It reads only the headers and the raw bytes; it never parses the body and never throws on a bad
 *           request (it answers a reason). Several signatures (a rotation) pass when one verifies. Web Crypto only.
 *           STA-1792 replaces this driver, and nothing else moves.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02); the Standard Webhooks header layout
 *                     (research R-4).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";

import type { RelayInboxConfig } from "#config/relay-inbox.config";
import { InboxVerifier } from "#contracts/index";
import type { InboxVerification } from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";
import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";

/** One `v1a,<key id>,<base64>` signature value. */
const SIGNATURE = /^v1a,([a-z0-9][a-z0-9-]*),([A-Za-z0-9+/]+={0,2})$/;

/** A refusal with `reason`. */
function refused(reason: string): InboxVerification {
  return { verified: false, reason };
}

/**
 * Verifies inbox requests against the pinned producers' keys.
 *
 * @example
 * const verifier = new ContractInboxVerifierDriver(buildConfig(RelayInboxConfig, { values: { producers } }), clock);
 */
export class ContractInboxVerifierDriver extends Driver(InboxVerifier) {
  /** The pinned producers' keys and the running environment. */
  private readonly config: RelayInboxConfig;

  /** Reads "now" for the timestamp window. */
  private readonly clock: Clock;

  /**
   * @param config - the pinned producers' public keys per environment, and the running environment.
   * @param clock - the time the window is measured from.
   */
  constructor(config: RelayInboxConfig, clock: Clock) {
    super();
    this.config = config;
    this.clock = clock;
  }

  /** Implements `InboxVerifier.verify`, documented there. */
  async verify(
    headers: Readonly<Record<string, string | undefined>>,
    body: string | Uint8Array,
  ): Promise<InboxVerification> {
    const id = headers["webhook-id"];
    const timestamp = headers["webhook-timestamp"];
    const signatures = headers["webhook-signature"];
    if (id === undefined || timestamp === undefined || signatures === undefined)
      return refused("missing_headers");
    const values = signatures.trim().split(/\s+/);
    if (
      !/^[\w-]{1,64}$/.test(id) ||
      !/^\d{1,12}$/.test(timestamp) ||
      !values.every((value) => SIGNATURE.test(value))
    )
      return refused("malformed_headers");
    const skew = Number(timestamp) * 1000 - this.clock.now().getTime();
    const window = Duration.toMilliseconds(CROSS_APP_DEFAULTS.signatureWindow);
    if (skew < -window) return refused("stale");
    if (skew > window) return refused("future");
    const prefix = new TextEncoder().encode(`${id}.${timestamp}.`);
    const raw = typeof body === "string" ? new TextEncoder().encode(body) : body;
    const content = new Uint8Array(prefix.length + raw.length);
    content.set(prefix);
    content.set(raw, prefix.length);
    let listed = false;
    for (const value of values) {
      const [, keyId = "", encoded = ""] = SIGNATURE.exec(value) ?? [];
      for (const [service, environments] of Object.entries(this.config.producers)) {
        const key = environments[this.config.environment]?.find((each) => each.id === keyId);
        if (key === undefined) continue;
        listed = true;
        if (await this.verifies(key.publicKey, encoded, content))
          return { verified: true, sender: { service, keyId } };
      }
    }
    return refused(listed ? "bad_signature" : "unknown_key");
  }

  /** Whether `encoded` is an Ed25519 signature of `content` by the raw public key `publicKey`; a bad key is `false`. */
  private async verifies(
    publicKey: string,
    encoded: string,
    content: Uint8Array<ArrayBuffer>,
  ): Promise<boolean> {
    const keyBytes = bytesOfBase64(publicKey);
    const signature = bytesOfBase64(encoded);
    if (keyBytes === undefined || signature === undefined) return false;
    try {
      const key = await crypto.subtle.importKey("raw", keyBytes, "Ed25519", false, ["verify"]);
      return await crypto.subtle.verify("Ed25519", key, signature, content);
    } catch {
      return false;
    }
  }
}
