/**
 * Stackra file contract:
 * Purpose: `AwardService`, the module service over `Award`: grants an award by hand, grants automatically the kinds
 *          whose published criteria match a recipient's facts, revokes, lists a recipient's live awards, resolves a
 *          verify token across scopes, and builds a certificate's fields with the verify URL and its QR code.
 * Boundary: a `CrudService<Award>`, so grants, revokes and reads run in the caller's transaction and scope session. A
 *           grant writes the award with `AwardGranted` and the token's `AwardVerification` row (its SHA-256 only) and
 *           flushes, so the outbox writes the event in the same transaction; a revoke records `AwardRevoked` and
 *           deletes that row, so the token stops resolving. `verify` reads the unscoped index, then opens the award's
 *           scope session (`Database.withScope`) to read it: call it from its own public action, never inside another
 *           action's transaction (the settings would last for the rest of it). Criteria are evaluated only through
 *           `evaluate` of @stackra/rules with the clock's time; the consumer computes the facts (ADR 0331 decision 9).
 *           The verify URL's base is the consumer's setting, never a literal here.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 2 to 7); OS ADR 0058 (decision 1 and Enforcement); ADR 0331 (decisions 6
 *                     and 9); ADR 0327 (decisions 3 and 9); ADR 0105 as amended by ADR 0294.
 */
import { createHash, randomBytes } from "node:crypto";

import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, type Database } from "@stackra/database";
import { isRefusal, NotFoundError } from "@stackra/errors";
import { evaluate, type Facts } from "@stackra/rules";
import type { RuleSetRevision, RuleSetService } from "@stackra/rules/node";

import type { CertificateFields, RecipientRef, VerifiedAward } from "#contracts/index";
import {
  AwardGranted,
  AwardNotGrantableError,
  AwardRevoked,
  AwardRevokedError,
  checkGrant,
  verifyQr,
} from "#core/index";
import { recipientRulesOf } from "#node/functions/recipient-rules-of.function";
import type { Award } from "#node/models/award.model";
import type { AwardKind } from "#node/models/award-kind.model";
import { AwardVerification } from "#node/models/award-verification.model";
import type { AwardKindService } from "#node/services/award-kind.service";

/** A verify token as `issue` writes it: 32 random bytes in base64url. */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The index key of a verify token. */
const hashOf = (token: string): string => createHash("sha256").update(token).digest("hex");

/**
 * Grants, revokes and verifies awards.
 *
 * @example
 * const award = await awards.grant(ctx.scope, { kindId, recipient, period: "2026-09" }, ctx.actor.id);
 * await awards.consider(ctx.scope, { model: "workforce.member", id }, facts, { period: "2026-09" });
 * const verified = await awards.verify(input.token); // null when unknown or revoked
 */
export class AwardService extends CrudService<Award> {
  /** Reads the kinds. */
  private readonly kinds: AwardKindService;

  /** Reads the kinds' published criteria. */
  private readonly ruleSets: RuleSetService;

  /** Opens an award's scope session for a verify. */
  private readonly database: Database;

  /** The current time of an evaluation and a revoke. */
  private readonly clock: Clock;

  /**
   * @param kinds - the award kind service.
   * @param ruleSets - the rule set service of @stackra/rules.
   * @param database - the connected database.
   * @param clock - the clock.
   */
  constructor(kinds: AwardKindService, ruleSets: RuleSetService, database: Database, clock: Clock) {
    super();
    this.kinds = kinds;
    this.ruleSets = ruleSets;
    this.database = database;
    this.clock = clock;
  }

  /**
   * Grants an award of `draft.kindId` to `draft.recipient` in `scope`, by the principal `grantedBy`.
   *
   * @throws AwardNotGrantableError when `checkGrant` refuses it.
   * @throws NotFoundError when the kind is not visible.
   */
  async grant(
    scope: ScopeRef,
    draft: {
      readonly kindId: PublicId<"awk">;
      readonly recipient: RecipientRef;
      readonly level?: string | null;
      readonly period?: string | null;
      readonly reason?: string | null;
    },
    grantedBy: string,
  ): Promise<Award> {
    const kind = await this.kinds.findOneOrFail({ id: draft.kindId });
    const level = draft.level ?? null;
    const period = draft.period ?? null;
    const refusal = checkGrant(
      kind,
      { recipientModel: draft.recipient.model, level, period },
      await this.liveOf(kind, draft.recipient),
    );
    if (refusal !== null) throw AwardNotGrantableError.create({ kindId: kind.id, reason: refusal });
    return this.issue(scope, kind, draft.recipient, {
      level,
      period,
      reason: draft.reason ?? null,
      grantedBy,
      ruleRevision: null,
    });
  }

  /**
   * Grants `recipient`, in `scope`, every active kind over its model whose published criteria match `facts` at the
   * clock's time and that it may hold: once for a kind that is not once per period, once per `options.period` for one
   * that is (skipped without a period). A kind with no published revision grants nothing.
   *
   * @returns the awards granted.
   * @throws InputInvalidError when the recipient model is not registered (`recipient: recipient_unknown`).
   */
  async consider(
    scope: ScopeRef,
    recipient: RecipientRef,
    facts: Facts,
    options: { readonly period?: string } = {},
  ): Promise<Award[]> {
    const rules = recipientRulesOf(recipient.model);
    const kinds = await this.kinds.find({
      recipientModel: recipient.model,
      isActive: true,
      ruleSetId: { $ne: null },
    });
    const now = this.clock.now();
    const granted: Award[] = [];
    for (const kind of kinds) {
      // oxlint-disable-next-line no-await-in-loop -- reason: one kind at a time in the caller's transaction
      const revision = await this.publishedOf(kind);
      if (revision === undefined) continue;
      if (!evaluate(rules, revision.condition, facts, { now, revision: revision.number }).matched)
        continue;
      // oxlint-disable-next-line no-await-in-loop -- reason: one kind at a time in the caller's transaction
      const live = await this.liveOf(kind, recipient);
      if (!kind.isOncePerPeriod && live.length > 0) continue;
      const period = kind.isOncePerPeriod ? (options.period ?? null) : null;
      if (checkGrant(kind, { recipientModel: recipient.model, level: null, period }, live) !== null)
        continue;
      granted.push(
        // oxlint-disable-next-line no-await-in-loop -- reason: each grant flushes its own rows and event
        await this.issue(scope, kind, recipient, {
          level: null,
          period,
          reason: null,
          grantedBy: null,
          ruleRevision: revision.number,
        }),
      );
    }
    return granted;
  }

  /**
   * Revokes the award with `reason`, records `AwardRevoked` and deletes its verify index row, so its token stops
   * resolving.
   *
   * @throws AwardRevokedError when it is revoked already.
   * @throws NotFoundError when it is not visible.
   */
  async revoke(awardId: PublicId<"awd">, reason: string): Promise<void> {
    const award = await this.findOneOrFail({ id: awardId });
    if (award.revokedAt !== null) throw AwardRevokedError.create({ awardId });
    award.revokedAt = this.clock.now();
    award.revokedReason = reason;
    award.record(
      AwardRevoked.create({
        awardId,
        kindId: award.kindId,
        recipientModel: award.recipientModel,
        recipientId: award.recipientId,
      }),
    );
    const em = this.em();
    for (const row of await em.find(AwardVerification, { awardId })) em.remove(row);
    await em.flush();
  }

  /** `recipient`'s live awards, newest first. */
  awardsOf(recipient: RecipientRef): Promise<Award[]> {
    return this.find(
      { recipientModel: recipient.model, recipientId: recipient.id, revokedAt: null },
      { orderBy: { createdAt: "desc" } },
    );
  }

  /**
   * The live award `token` was issued with, from any scope, or null for an unknown, malformed or revoked token. Opens
   * the award's scope session: call it from its own action.
   */
  async verify(token: string): Promise<VerifiedAward | null> {
    if (!TOKEN.test(token)) return null;
    const index = await this.em().findOne(AwardVerification, { tokenHash: hashOf(token) });
    if (index === null) return null;
    return this.database.withScope({ id: index.scopeId, path: index.scopePath }, async () => {
      const award = await this.findOne({ id: index.awardId, revokedAt: null });
      if (award === null || award.verifyToken !== token) return null;
      const kind = await this.kinds.findOneOrFail({ id: award.kindId });
      return {
        awardId: award.id,
        kindId: kind.id,
        kindName: kind.name,
        level: award.level,
        period: award.period,
        recipient: { model: award.recipientModel, id: award.recipientId },
        grantedAt: award.createdAt,
      };
    });
  }

  /**
   * The certificate fields of a live award, its verify URL under `verifyBaseUrl` (the consumer's setting) and that
   * URL's QR code.
   *
   * @throws AwardRevokedError when it is revoked.
   * @throws NotFoundError when it is not visible.
   */
  async certificateOf(awardId: PublicId<"awd">, verifyBaseUrl: string): Promise<CertificateFields> {
    const award = await this.findOneOrFail({ id: awardId });
    if (award.revokedAt !== null) throw AwardRevokedError.create({ awardId });
    const kind = await this.kinds.findOneOrFail({ id: award.kindId });
    const base = verifyBaseUrl.endsWith("/") ? verifyBaseUrl : `${verifyBaseUrl}/`;
    const verifyUrl = new URL(award.verifyToken, base).toString();
    return {
      awardId,
      template: kind.certificateTemplate,
      kindName: kind.name,
      level: award.level,
      period: award.period,
      grantedAt: award.createdAt,
      verifyUrl,
      verifyQr: verifyQr(verifyUrl),
    };
  }

  /** Writes the award with `AwardGranted` and its verify index row, and flushes. */
  private async issue(
    scope: ScopeRef,
    kind: AwardKind,
    recipient: RecipientRef,
    grant: {
      readonly level: string | null;
      readonly period: string | null;
      readonly reason: string | null;
      readonly grantedBy: string | null;
      readonly ruleRevision: number | null;
    },
  ): Promise<Award> {
    const em = this.em();
    const verifyToken = randomBytes(32).toString("base64url");
    const award = em.create(this.model(), {
      kindId: kind.id,
      scopeId: scope.id,
      scopePath: scope.path,
      recipientModel: recipient.model,
      recipientId: recipient.id,
      ...grant,
      verifyToken,
      revokedAt: null,
      revokedReason: null,
    });
    award.record(
      AwardGranted.create({
        awardId: award.id,
        kindId: kind.id,
        recipientModel: recipient.model,
        recipientId: recipient.id,
        level: grant.level,
        period: grant.period,
      }),
    );
    em.create(AwardVerification, {
      tokenHash: hashOf(verifyToken),
      awardId: award.id,
      scopeId: scope.id,
      scopePath: scope.path,
    });
    await em.flush();
    return award;
  }

  /** `recipient`'s live awards of `kind`. */
  private liveOf(kind: AwardKind, recipient: RecipientRef): Promise<Award[]> {
    return this.find({ kindId: kind.id, recipientId: recipient.id, revokedAt: null });
  }

  /** The kind's published criteria revision, or `undefined` while none is published. */
  private async publishedOf(kind: AwardKind): Promise<RuleSetRevision | undefined> {
    if (kind.ruleSetId === null) return undefined;
    try {
      return await this.ruleSets.revision(kind.ruleSetId);
    } catch (error) {
      if (isRefusal(error, NotFoundError)) return undefined;
      throw error;
    }
  }
}
