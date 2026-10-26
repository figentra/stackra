/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardService`: a grant writes the award with `AwardGranted` and a verification row holding
 *          only the token's hash, and a refused grant writes nothing; `consider` grants each matched kind once (or once
 *          per period) and skips an unmatched kind or one with no published revision; a revoke records
 *          `AwardRevoked`, deletes the verification row and refuses a second revoke; a verify token resolves only its
 *          own award, in its scope, and nothing once revoked, unknown or malformed; a short code resolves however it is
 *          typed and only its hash is indexed; a lost race on the unique live-period index is refused as
 *          `period_taken`; a certificate carries the verify URL, its QR code and the short code, is rendered through
 *          @stackra/documents, and is refused for a revoked award; `awardsOf` reads the live awards.
 * Boundary: test only; the kind and rule set services, the database's scope session and the clock are in-test fakes, a
 *           fake `Database.current()` hands out an in-memory entity manager, and @stackra/rules evaluates for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 2 to 7); ADR 0432 (decisions 2 to 4); OS ADR 0058
 *                     (Enforcement).
 */
import { createHash } from "node:crypto";

import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners, UniqueViolation } from "@stackra/database";
import { DocumentFormat, type DocumentTemplate, PRINT_DOCUMENT_KIND } from "@stackra/documents";
import { NotFoundError } from "@stackra/errors";
import { takeRecordedEvents } from "@stackra/events";
import { type Condition, Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import type { RuleSetService } from "@stackra/rules/node";
import { afterAll, afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { GrantRefusal } from "#contracts/index";
import {
  AwardGranted,
  AwardNotGrantableError,
  AwardRevoked,
  AwardRevokedError,
  normalizeAwardCode,
  verifyQr,
} from "#core/index";
import { AWARD_RECIPIENTS } from "#node/constants/award-recipients.constant";
import { Award } from "#node/models/award.model";
import { AwardKind } from "#node/models/award-kind.model";
import { AwardVerification } from "#node/models/award-verification.model";
import type { AwardKindService } from "#node/services/award-kind.service";
import { AwardService } from "#node/services/award.service";

registerModelPartners([[AwardService, Award]]);

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const AT = new Date("2026-10-25T09:00:00Z");
const RULE_SET = "rset_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"rset">;
const MEMBER = { model: "test.member", id: "mem_01j9z3k4m5n6p7q8r9s0t1v2w4" };

/** The fields criteria over test members may test. */
const RULES = Rules.create({
  key: "test.member_award",
  sources: [
    {
      key: "member",
      fields: {
        sales: { type: FieldType.Number, label: "test::facts.sales" as FactField["label"] },
      },
    },
  ],
});
AWARD_RECIPIENTS.set(MEMBER.model, RULES);

/** Members who sold at least 100. */
const TOP_SELLER: Condition = { field: "member.sales", operator: Operator.AtLeast, value: 100 };

/** A kind with `data`. */
const kindOf = (data: Partial<AwardKind> = {}): AwardKind =>
  Object.assign(new AwardKind(), {
    scopeId: ACME.id,
    scopePath: ACME.path,
    key: "top_seller",
    name: "Top seller",
    recipientModel: MEMBER.model,
    levels: [],
    isAscending: false,
    isOncePerPeriod: false,
    ruleSetId: null,
    certificateTemplate: "test::print/certificate",
    isActive: true,
    ...data,
  });

/** Whether `row` matches every key of `where` (a `{ $ne: null }` value matches any non-null). */
const matches = (row: object, where: object): boolean =>
  Object.entries(where).every(([key, value]) => {
    const field = (row as Record<string, unknown>)[key];
    if (value !== null && typeof value === "object" && "$ne" in value) return field !== value.$ne;
    return field === value;
  });

/** A service over fakes holding `kinds`; `published` is false when no criteria revision is published. */
function setup(kinds: readonly AwardKind[], options: { readonly published?: boolean } = {}) {
  const awards: Award[] = [];
  const verifications: AwardVerification[] = [];
  const storeOf = (model: unknown): object[] =>
    model === AwardVerification ? verifications : awards;
  const em = {
    create: vi.fn((Type: new () => object, data: object) => {
      const row = Object.assign(new Type(), { createdAt: AT }, data);
      storeOf(Type).push(row);
      return row;
    }),
    find: vi.fn(async (model: unknown, where: object) =>
      storeOf(model).filter((row) => matches(row, where)),
    ),
    findOne: vi.fn(
      async (model: unknown, where: object) =>
        storeOf(model).find((row) => matches(row, where)) ?? null,
    ),
    findOneOrFail: vi.fn(async (model: unknown, where: object) => {
      const row = storeOf(model).find((candidate) => matches(candidate, where));
      if (row === undefined) throw NotFoundError.create();
      return row;
    }),
    remove: vi.fn((row: object) => {
      const store = storeOf(row.constructor);
      store.splice(store.indexOf(row), 1);
    }),
    flush: vi.fn(async () => undefined),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  const kindService = {
    find: vi.fn(async (where: object) => kinds.filter((kind) => matches(kind, where))),
    findOneOrFail: vi.fn(async (where: object) => {
      const kind = kinds.find((candidate) => matches(candidate, where));
      if (kind === undefined) throw NotFoundError.create();
      return kind;
    }),
  };
  const ruleSets = {
    revision: vi.fn(async () => {
      if (options.published === false) throw NotFoundError.create();
      return { number: 4, condition: TOP_SELLER, publishedAt: AT };
    }),
  };
  const scopes: ScopeRef[] = [];
  const database = {
    withScope: vi.fn(async (scope: ScopeRef, work: () => Promise<unknown>) => {
      scopes.push(scope);
      return work();
    }),
  };
  const service = new AwardService(
    kindService as unknown as AwardKindService,
    ruleSets as unknown as RuleSetService,
    database as unknown as Database,
    { now: () => AT } as unknown as Clock,
  );
  return { service, awards, verifications, em, scopes };
}

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  AWARD_RECIPIENTS.clear();
});

describe(AwardService, () => {
  it("grants an award with AwardGranted and a verification row holding only the token's hash", async () => {
    const kind = kindOf();
    const { service, awards, verifications } = setup([kind]);
    const award = await service.grant(
      ACME,
      { kindId: kind.id, recipient: MEMBER, reason: "Q3" },
      "usr_1",
    );
    expect(awards).toEqual([award]);
    expect(award).toMatchObject({
      kindId: kind.id,
      scopeId: ACME.id,
      recipientId: MEMBER.id,
      reason: "Q3",
      grantedBy: "usr_1",
      ruleRevision: null,
      revokedAt: null,
    });
    expect(award.verifyToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(verifications).toHaveLength(1);
    expect(verifications[0]).toMatchObject({
      tokenHash: createHash("sha256").update(award.verifyToken).digest("hex"),
      codeHash: createHash("sha256")
        .update(normalizeAwardCode(award.verifyCode ?? "") ?? "")
        .digest("hex"),
      awardId: award.id,
      scopePath: ACME.path,
    });
    expect(award.verifyCode).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(JSON.stringify(verifications[0])).not.toContain(award.verifyToken);
    expect(JSON.stringify(verifications[0])).not.toContain(award.verifyCode);
    expect(takeRecordedEvents(award)).toEqual([
      AwardGranted.create({
        awardId: award.id,
        kindId: kind.id,
        recipientModel: MEMBER.model,
        recipientId: MEMBER.id,
        level: null,
        period: null,
      }),
    ]);
  });

  it("refuses a grant the kind does not allow and writes nothing", async () => {
    const kind = kindOf({ isOncePerPeriod: true });
    const { service, awards } = setup([kind]);
    const refused = await service
      .grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1")
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(AwardNotGrantableError);
    expect((refused as AwardNotGrantableError).reason).toBe(GrantRefusal.PeriodRequired);
    expect(awards).toEqual([]);
  });

  it("grants a matched kind once by its criteria and skips an unmatched recipient", async () => {
    const kind = kindOf({ ruleSetId: RULE_SET });
    const { service, awards } = setup([kind, kindOf({ key: "manual" })]);
    const [award] = await service.consider(ACME, MEMBER, { member: { sales: 150 } });
    expect(award).toMatchObject({ kindId: kind.id, grantedBy: null, ruleRevision: 4 });
    await expect(service.consider(ACME, MEMBER, { member: { sales: 150 } })).resolves.toEqual([]);
    await expect(
      service.consider(ACME, { ...MEMBER, id: "mem_2" }, { member: { sales: 10 } }),
    ).resolves.toEqual([]);
    expect(awards).toHaveLength(1);
  });

  it("grants a once-per-period kind once per period and not without one", async () => {
    const kind = kindOf({ ruleSetId: RULE_SET, isOncePerPeriod: true });
    const { service, awards } = setup([kind]);
    const facts = { member: { sales: 150 } };
    await expect(service.consider(ACME, MEMBER, facts)).resolves.toEqual([]);
    await service.consider(ACME, MEMBER, facts, { period: "2026-09" });
    await service.consider(ACME, MEMBER, facts, { period: "2026-09" });
    await service.consider(ACME, MEMBER, facts, { period: "2026-10" });
    expect(awards.map((award) => award.period)).toEqual(["2026-09", "2026-10"]);
  });

  it("grants nothing by a kind with no published criteria", async () => {
    const { service } = setup([kindOf({ ruleSetId: RULE_SET })], { published: false });
    await expect(service.consider(ACME, MEMBER, { member: { sales: 150 } })).resolves.toEqual([]);
  });

  it("revokes with AwardRevoked, stops the token resolving and refuses a second revoke", async () => {
    const kind = kindOf();
    const { service, verifications } = setup([kind]);
    const award = await service.grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1");
    takeRecordedEvents(award);
    await expect(service.verify(award.verifyToken)).resolves.not.toBeNull();
    await service.revoke(award.id, "Issued in error");
    expect(award).toMatchObject({ revokedAt: AT, revokedReason: "Issued in error" });
    expect(takeRecordedEvents(award)).toEqual([
      AwardRevoked.create({
        awardId: award.id,
        kindId: kind.id,
        recipientModel: MEMBER.model,
        recipientId: MEMBER.id,
      }),
    ]);
    expect(verifications).toEqual([]);
    await expect(service.verify(award.verifyToken)).resolves.toBeNull();
    await expect(service.revoke(award.id, "again")).rejects.toBeInstanceOf(AwardRevokedError);
  });

  it("resolves a verify token to its own award only, in the award's scope", async () => {
    const kind = kindOf();
    const { service, scopes } = setup([kind]);
    const first = await service.grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1");
    const second = await service.grant(
      ACME,
      { kindId: kind.id, recipient: { ...MEMBER, id: "mem_2" } },
      "usr_1",
    );
    await expect(service.verify(first.verifyToken)).resolves.toEqual({
      awardId: first.id,
      kindId: kind.id,
      kindName: "Top seller",
      level: null,
      period: null,
      recipient: MEMBER,
      grantedAt: AT,
    });
    await expect(service.verify(second.verifyToken)).resolves.toMatchObject({ awardId: second.id });
    expect(scopes).toEqual([ACME, ACME]);
    await expect(service.verify("A".repeat(43))).resolves.toBeNull();
    await expect(service.verify("not a token")).resolves.toBeNull();
  });

  it("builds a certificate with the verify URL and its QR code, and refuses a revoked award", async () => {
    const kind = kindOf();
    const { service } = setup([kind]);
    const award = await service.grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1");
    const url = `https://verify.example.com/awards/${award.verifyToken}`;
    await expect(
      service.certificateOf(award.id, "https://verify.example.com/awards"),
    ).resolves.toEqual({
      awardId: award.id,
      template: "test::print/certificate",
      kindName: "Top seller",
      level: null,
      period: null,
      grantedAt: AT,
      verifyUrl: url,
      verifyCode: award.verifyCode,
      verifyQr: verifyQr(url),
    });
    await service.revoke(award.id, "Issued in error");
    await expect(
      service.certificateOf(award.id, "https://verify.example.com/awards/"),
    ).rejects.toBeInstanceOf(AwardRevokedError);
  });

  it("resolves a short code however it is typed, and nothing once revoked", async () => {
    const kind = kindOf();
    const { service } = setup([kind]);
    const award = await service.grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1");
    const typed = (award.verifyCode ?? "").toLowerCase().replace(/-/g, " ");
    await expect(service.verifyCode(typed)).resolves.toMatchObject({ awardId: award.id });
    await expect(service.verifyCode("0000-0000-0000")).resolves.toBeNull();
    await expect(service.verifyCode("short")).resolves.toBeNull();
    await service.revoke(award.id, "Issued in error");
    await expect(service.verifyCode(award.verifyCode ?? "")).resolves.toBeNull();
  });

  it("refuses the loser of a concurrent period grant as period_taken", async () => {
    const kind = kindOf({ isOncePerPeriod: true });
    const { service, em } = setup([kind]);
    em.flush.mockRejectedValueOnce(new UniqueViolation(new Error("duplicate key")));
    const refused = await service
      .grant(ACME, { kindId: kind.id, recipient: MEMBER, period: "2026-09" }, "usr_1")
      .catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(AwardNotGrantableError);
    expect((refused as AwardNotGrantableError).reason).toBe(GrantRefusal.PeriodTaken);
  });

  it("renders the certificate through @stackra/documents", async () => {
    const kind = kindOf();
    const { service } = setup([kind]);
    const award = await service.grant(ACME, { kindId: kind.id, recipient: MEMBER }, "usr_1");
    const template: DocumentTemplate = {
      kind: PRINT_DOCUMENT_KIND,
      name: "certificate",
      version: "1",
      page: { widthMm: 297, heightMm: 210, marginMm: 10 },
      locales: [{ code: "en", direction: "ltr" }],
      layout: "single",
      blocks: [
        {
          type: "text",
          role: "title",
          text: { en: "{{award.kindName}}: {{recipient.name}} ({{award.verifyCode}})" },
          align: "center",
        },
        {
          type: "qr",
          value: "{{award.verifyUrl}}",
          sizeMm: 30,
          errorCorrection: "M",
          align: "center",
        },
      ],
    };
    const rendered = await service.renderCertificate(award.id, {
      verifyBaseUrl: "https://verify.example.com/awards",
      template,
      format: DocumentFormat.Html,
      recipient: { name: "Mona" },
    });
    const html = new TextDecoder().decode(rendered.bytes);
    expect(html).toContain("Top seller");
    expect(html).toContain("Mona");
    expect(html).toContain(award.verifyCode ?? "");
  });

  it("reads a recipient's live awards", async () => {
    const kind = kindOf();
    const { service, em } = setup([kind]);
    await service.awardsOf(MEMBER);
    expect(em.find.mock.calls[0]?.slice(1)).toEqual([
      { recipientModel: MEMBER.model, recipientId: MEMBER.id, revokedAt: null },
      { orderBy: { createdAt: "desc" } },
    ]);
  });
});
