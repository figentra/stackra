/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshotIssuer`, the server half of the consent endpoint (ADR 0472 decision 1): it takes the
 *          client's stored decision, re-applies the ledger's rules to it, and signs a short-lived `ConsentSnapshot`.
 * Boundary: a singleton service over `ConsentConfig` and the `Signer` port. It never trusts the client's grants: the
 *           record is parsed at the boundary, a record for another policy version or past its expiry grants nothing
 *           optional, Global Privacy Control refuses every optional category, a category the configuration does not
 *           list is ignored, and before a decision the region's regime applies (opt-out grants `defaultGranted`).
 *           The snapshot lives `snapshotLifetimeMinutes`, never past the decision's own expiry. It stores nothing,
 *           and a snapshot is never evidence (`ConsentProofService` keeps person-level proof). The HTTP route that
 *           calls it is the host's (an action on the consent endpoint).
 * Runtime: isomorphic (a server or a Worker; the private key stays with the `Signer` driver)
 * Governing contract: ADR 0472 (decisions 1, 2, 5 and 6); ADR 0298 (decisions 1 to 4); ADR 0416.
 */
import { Service } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";
import type { Signer } from "@stackra/contracts";

import type { ConsentConfig } from "#config/consent.config";
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";
import type { ConsentSnapshotRequest } from "#contracts/types/consent-snapshot-request.type";
import { ConsentCategory } from "#core/enums/consent-category.enum";
import { ConsentRegime } from "#core/enums/consent-regime.enum";
import { encodeConsentSnapshot } from "#core/functions/encode-consent-snapshot.function";
import { parseConsentRecord } from "#core/functions/parse-consent-record.function";
import type { IssuedConsentSnapshot } from "#core/types/issued-consent-snapshot.type";

/** Milliseconds in a day and a minute. */
const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * Signs consent snapshots.
 *
 * @example
 * const { token, snapshot } = await issuer.issue(input, ctx.actor.id);
 * return { token, expiresAt: snapshot.expiresAt };
 */
export class ConsentSnapshotIssuer extends Service {
  private readonly config: ConsentConfig;

  private readonly signer: Signer;

  /**
   * @param config - the categories, the policy version, the expiry, the regional defaults and the snapshot lifetime.
   * @param signer - the key snapshots are signed with.
   */
  constructor(config: ConsentConfig, signer: Signer) {
    super();
    this.config = config;
    this.signer = signer;
  }

  /**
   * A signed snapshot of `request`'s decision. The subject is the client's analytics anonymous id when analytics is
   * granted, else `principal` (the signed-in user's public id) when given, else a random id.
   */
  async issue(request: ConsentSnapshotRequest, principal?: string): Promise<IssuedConsentSnapshot> {
    const now = Date.now();
    const record = this.current(request.record, now);
    const granted: string[] = [];
    const refused: string[] = [];
    const regime = this.regime(request.region);
    for (const entry of this.config.categories) {
      const choice = record?.categories[entry.category];
      const allowed =
        entry.required ||
        (!request.globalPrivacyControl &&
          (choice ?? (regime === ConsentRegime.Ccpa && entry.defaultGranted)));
      (allowed ? granted : refused).push(entry.category);
    }
    const lifetimeEnd = now + this.config.snapshotLifetimeMinutes * MINUTE_MS;
    const decisionEnd =
      record === null
        ? lifetimeEnd
        : Date.parse(record.decidedAt) + this.config.expiryDays * DAY_MS;
    const snapshot: ConsentSnapshot = Object.freeze({
      id: mintPublicId("csn", now),
      subject: this.subjectOf(request, granted, principal),
      policyVersion: this.config.policyVersion,
      granted: Object.freeze(granted),
      refused: Object.freeze(refused),
      regime,
      region: request.region,
      globalPrivacyControl: request.globalPrivacyControl,
      decidedAt: record?.decidedAt ?? null,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(Math.min(lifetimeEnd, decisionEnd)).toISOString(),
    });
    return Object.freeze({ token: await encodeConsentSnapshot(snapshot, this.signer), snapshot });
  }

  /** The client's record when it is well formed, answers the current policy and has not expired; else `null`. */
  private current(value: unknown, now: number): ConsentRecord | null {
    const record = parseConsentRecord(value);
    if (record === null || record.policyVersion !== this.config.policyVersion) return null;
    const decidedAt = Date.parse(record.decidedAt);
    if (
      Number.isNaN(decidedAt) ||
      decidedAt > now ||
      decidedAt + this.config.expiryDays * DAY_MS <= now
    )
      return null;
    return record;
  }

  /** The regime before a decision: the region's, else the `default` entry's, else opt-in. */
  private regime(region: string | null): ConsentRegime {
    const defaults = this.config.regionDefaults;
    return (
      (region === null ? undefined : defaults[region]) ?? defaults.default ?? ConsentRegime.Gdpr
    );
  }

  /** Whom the snapshot binds to (ADR 0472 decision 2). */
  private subjectOf(
    request: ConsentSnapshotRequest,
    granted: readonly string[],
    principal: string | undefined,
  ): string {
    if (
      request.subject !== undefined &&
      request.subject !== "" &&
      granted.includes(ConsentCategory.Analytics)
    )
      return request.subject;
    if (principal !== undefined && principal !== "") return principal;
    return mintPublicId("anon");
  }
}
