/**
 * Stackra file contract:
 * Purpose: unit tests of `AttachmentVisibilityCache`: an answer is reused per parent and per whole actor chain until
 *          its time is up, a question in flight is shared, a failed question is never kept, `forget` drops only its
 *          parent's answers, the oldest answer leaves when it is full, and the limits are checked.
 * Boundary: test only; a hand-moved clock and counted questions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0333 (2026-10-24 amendment); STA-1960.
 */
import { ActorKind, Clock, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AttachmentParent } from "#core/types/attachment-parent.type";
import { AttachmentVisibilityCache } from "#core/values/attachment-visibility-cache.value";

const MATTER: AttachmentParent = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const MATTER_2: AttachmentParent = { model: "legal.matter", id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w4" };
const CLAIM: AttachmentParent = {
  model: "finance.expense_claim",
  id: "mat_01j9z3k4m5n6p7q8r9s0t1v2w3",
};
const LAWYER: Actor = {
  kind: ActorKind.User,
  id: "usr_01jab3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
};
const CLIENT: Actor = {
  kind: ActorKind.User,
  id: "usr_01jab3k4m5n6p7q8r9s0t1v2w4",
  realm: Realm.Customer,
};

/** A clock moved by hand. */
class HandClock extends Clock {
  at = 1_000_000;

  override now(): Date {
    return new Date(this.at);
  }
}

/** A question that answers `value` and counts how often it was asked. */
function counted(value: boolean): { ask: () => Promise<boolean>; readonly calls: () => number } {
  let calls = 0;
  return {
    ask: async () => {
      calls += 1;
      return value;
    },
    calls: () => calls,
  };
}

describe(AttachmentVisibilityCache, () => {
  it("reuses an answer until its time is up, then asks again", async () => {
    const clock = new HandClock();
    const cache = new AttachmentVisibilityCache({ ttlMs: 1000, clock });
    const question = counted(true);
    expect(await cache.answer(MATTER, LAWYER, question.ask)).toBe(true);
    clock.at += 999;
    expect(await cache.answer(MATTER, LAWYER, question.ask)).toBe(true);
    expect(question.calls()).toBe(1);
    clock.at += 1;
    expect(await cache.answer(MATTER, LAWYER, question.ask)).toBe(true);
    expect(question.calls()).toBe(2);
  });

  it("never serves one actor's answer to another, down to the delegation chain", async () => {
    const cache = new AttachmentVisibilityCache();
    const lawyer = counted(true);
    expect(await cache.answer(MATTER, LAWYER, lawyer.ask)).toBe(true);
    const client = counted(false);
    expect(await cache.answer(MATTER, CLIENT, client.ask)).toBe(false);
    const agentForClient: Actor = {
      kind: ActorKind.Agent,
      id: "agt_01jab3k4m5n6p7q8r9s0t1v2w3",
      onBehalfOf: CLIENT,
    };
    const agentForLawyer: Actor = { ...agentForClient, onBehalfOf: LAWYER };
    const forClient = counted(false);
    expect(await cache.answer(MATTER, agentForClient, forClient.ask)).toBe(false);
    const forLawyer = counted(true);
    expect(await cache.answer(MATTER, agentForLawyer, forLawyer.ask)).toBe(true);
    const otherScope = counted(false);
    expect(
      await cache.answer(
        MATTER,
        { ...LAWYER, scopeId: "scp_01jab3k4m5n6p7q8r9s0t1v2w3" },
        otherScope.ask,
      ),
    ).toBe(false);
    expect([client.calls(), forClient.calls(), forLawyer.calls(), otherScope.calls()]).toEqual([
      1, 1, 1, 1,
    ]);
  });

  it("keeps parents apart by model and by id", async () => {
    const cache = new AttachmentVisibilityCache();
    expect(await cache.answer(MATTER, LAWYER, counted(true).ask)).toBe(true);
    expect(await cache.answer(MATTER_2, LAWYER, counted(false).ask)).toBe(false);
    expect(await cache.answer(CLAIM, LAWYER, counted(false).ask)).toBe(false);
  });

  it("counts only a literal true", async () => {
    const cache = new AttachmentVisibilityCache();
    expect(await cache.answer(MATTER, LAWYER, async () => "true" as unknown as boolean)).toBe(
      false,
    );
  });

  it("shares a question in flight", async () => {
    const cache = new AttachmentVisibilityCache();
    const question = counted(true);
    const [first, second] = await Promise.all([
      cache.answer(MATTER, LAWYER, question.ask),
      cache.answer(MATTER, LAWYER, question.ask),
    ]);
    expect([first, second]).toEqual([true, true]);
    expect(question.calls()).toBe(1);
  });

  it("never keeps a failed question: the error reaches the caller and the next call asks again", async () => {
    const cache = new AttachmentVisibilityCache();
    await expect(
      cache.answer(MATTER, LAWYER, async () => {
        throw new Error("matters service unavailable");
      }),
    ).rejects.toThrow("matters service unavailable");
    const question = counted(true);
    expect(await cache.answer(MATTER, LAWYER, question.ask)).toBe(true);
    expect(question.calls()).toBe(1);
  });

  it("forgets every actor's answer about one parent, and only that parent's", async () => {
    const cache = new AttachmentVisibilityCache();
    await cache.answer(MATTER, LAWYER, counted(true).ask);
    await cache.answer(MATTER, CLIENT, counted(true).ask);
    await cache.answer(MATTER_2, LAWYER, counted(true).ask);
    cache.forget(MATTER);
    const lawyer = counted(false);
    const client = counted(false);
    const kept = counted(false);
    expect(await cache.answer(MATTER, LAWYER, lawyer.ask)).toBe(false);
    expect(await cache.answer(MATTER, CLIENT, client.ask)).toBe(false);
    expect(await cache.answer(MATTER_2, LAWYER, kept.ask)).toBe(true);
    expect([lawyer.calls(), client.calls(), kept.calls()]).toEqual([1, 1, 0]);
  });

  it("lets the oldest answer go when it is full", async () => {
    const cache = new AttachmentVisibilityCache({ maxEntries: 2 });
    await cache.answer(MATTER, LAWYER, counted(true).ask);
    await cache.answer(MATTER_2, LAWYER, counted(true).ask);
    await cache.answer(MATTER, LAWYER, counted(true).ask); // used again: now the newest
    await cache.answer(CLAIM, LAWYER, counted(true).ask); // full: MATTER_2 leaves
    const matter = counted(false);
    const matter2 = counted(false);
    expect(await cache.answer(MATTER, LAWYER, matter.ask)).toBe(true);
    expect(await cache.answer(MATTER_2, LAWYER, matter2.ask)).toBe(false);
    expect([matter.calls(), matter2.calls()]).toEqual([0, 1]);
  });

  it("refuses a time above a minute or not above 0, and a size that is not a positive whole number", () => {
    for (const ttlMs of [0, -1, 60_001, Number.NaN, Number.POSITIVE_INFINITY])
      expect(() => new AttachmentVisibilityCache({ ttlMs })).toThrow(RangeError);
    for (const maxEntries of [0, -1, 1.5, Number.NaN])
      expect(() => new AttachmentVisibilityCache({ maxEntries })).toThrow(RangeError);
    expect(() => new AttachmentVisibilityCache({ ttlMs: 60_000, maxEntries: 1 })).not.toThrow();
  });

  it("reads the host clock by default", async () => {
    const cache = new AttachmentVisibilityCache();
    const question = counted(true);
    await cache.answer(MATTER, LAWYER, question.ask);
    await cache.answer(MATTER, LAWYER, question.ask);
    expect(question.calls()).toBe(1);
  });
});
