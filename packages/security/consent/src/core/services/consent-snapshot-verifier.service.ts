/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshotVerifier`, the check of a consent snapshot token (ADR 0472 decisions 2 and 4): it answers a
 *          verified `CallConsent` (id, subject, granted categories, expiry) only when the token is well formed, signed
 *          by a trusted key, already valid, not expired, for the current policy version and without Global Privacy
 *          Control; otherwise a refusal with its reason and nothing granted.
 * Boundary: a singleton service over `ConsentConfig` and the `ConsentSnapshotKeys` port; it needs public keys only, so
 *           a Worker runs it. Never throws on a bad token. The checks run in a fixed order (malformed, untrusted key,
 *           bad signature, not yet valid, expired, policy outdated, Global Privacy Control) and the first failure is
 *           the reason. The action pipeline reaches it through `SnapshotConsentCheckDriver`; an ingest Worker calls it
 *           directly.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 2 to 4); ADR 0298 (decision 1: refusal by default); ADR 0416.
 */
import { ConsentRefusal } from "@stackra/actions/contracts";
import type { CallConsent } from "@stackra/actions/contracts";
import { Service } from "@stackra/container";
import { verifySignature } from "@stackra/contracts";

import type { ConsentConfig } from "#config/consent.config";
import type { ConsentSnapshotKeys } from "#contracts/ports/consent-snapshot-keys.port";
import { decodeConsentSnapshot } from "#core/functions/decode-consent-snapshot.function";

/**
 * Verifies consent snapshots.
 *
 * @example
 * const consent = await verifier.verify(request.headers.get(CONSENT_SNAPSHOT_HEADER) ?? "");
 * if (consent.granted.includes(ConsentCategory.Marketing)) await capi.send(conversion);
 */
export class ConsentSnapshotVerifier extends Service {
  private readonly config: ConsentConfig;

  private readonly keys: ConsentSnapshotKeys;

  /**
   * @param config - the current policy version and the allowed clock skew.
   * @param keys - the public keys a snapshot may be signed with.
   */
  constructor(config: ConsentConfig, keys: ConsentSnapshotKeys) {
    super();
    this.config = config;
    this.keys = keys;
  }

  /** What `token` proves about the visitor's consent at this instant. */
  async verify(token: string): Promise<CallConsent> {
    if (token === "") return refused(ConsentRefusal.Missing);
    const decoded = decodeConsentSnapshot(token);
    if (decoded === null) return refused(ConsentRefusal.Malformed);
    const { snapshot, message, signature } = decoded;
    const key = (await this.keys.trusted()).find((item) => item.keyId === signature.keyId);
    if (key === undefined) return refused(ConsentRefusal.UntrustedKey);
    if (!(await verifySignature(key, message, signature)))
      return refused(ConsentRefusal.BadSignature);
    const now = Date.now();
    if (Date.parse(snapshot.issuedAt) > now + this.config.snapshotClockSkewSeconds * 1000)
      return refused(ConsentRefusal.NotYetValid);
    const expiresAt = Date.parse(snapshot.expiresAt);
    if (expiresAt <= now) return refused(ConsentRefusal.Expired);
    if (snapshot.policyVersion !== this.config.policyVersion)
      return refused(ConsentRefusal.PolicyOutdated);
    if (snapshot.globalPrivacyControl) return refused(ConsentRefusal.GlobalPrivacyControl);
    return Object.freeze({
      verified: true,
      snapshotId: snapshot.id,
      subject: snapshot.subject,
      granted: Object.freeze([...snapshot.granted]),
      expiresAt: new Date(expiresAt),
    });
  }
}

/** A refusal for `reason`: nothing granted. */
function refused(reason: ConsentRefusal): CallConsent {
  return Object.freeze({ verified: false, refusal: reason, granted: Object.freeze([]) });
}
