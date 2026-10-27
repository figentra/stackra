/**
 * Stackra file contract:
 * Purpose: unit tests of `runVerificationCase`: a driver that answers what was recorded passes; a wrong status, a
 *          missing kind, a reason that is not snake_case, a verified check with reasons, an echoed subject fact and an
 *          unexpected outage are each reported; a recorded outage passes on `verification_unavailable`; a non-refusal
 *          error is rethrown.
 * Boundary: test only; the memory driver and two in-file drivers, no vendor.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; Stackra 0357 (decision 7); ADR 0443 (decision 8); owner decision D3 (2026-10-27).
 */
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Verification, VerificationKind, VerificationStatus } from "#contracts/index";
import type { VerificationResult } from "#contracts/index";
import { MemoryVerificationDriver, VerificationUnavailableError } from "#core/index";
import { runVerificationCase } from "#testing/functions/run-verification-case.function";
import type { VerificationCase } from "#testing/types/verification-case.type";

/** Always 2026-10-27 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-27T09:00:00Z");
  }
}

/** Answers the fixed `answer` for any identity check, or throws `failure`. */
class ScriptedVerificationDriver extends Driver(Verification) {
  private readonly answer: Omit<VerificationResult, "provider"> | (() => never);

  constructor(answer: Omit<VerificationResult, "provider"> | (() => never)) {
    super();
    this.answer = answer;
  }

  supports(kind: VerificationKind): boolean {
    return kind === VerificationKind.Identity;
  }

  async verify(): Promise<Omit<VerificationResult, "provider">> {
    return typeof this.answer === "function" ? this.answer() : this.answer;
  }
}

const clock = new FixedClockDriver();

const recorded = (expected: VerificationCase["expect"]): VerificationCase => ({
  id: "memory.identity",
  source: "the in-repo memory driver",
  certification: "pending",
  request: {
    kind: VerificationKind.Identity,
    market: "xx",
    reference: "chk_1",
    subject: { nationalId: "1234567890", name: { full: "Test Person" } },
    consented: true,
  },
  expect: expected,
});

const answerOf = (
  over: Partial<Omit<VerificationResult, "provider">>,
): Omit<VerificationResult, "provider"> => ({
  status: VerificationStatus.Verified,
  providerReference: "ref_1",
  checkedAt: clock.now(),
  reasons: [],
  ...over,
});

describe("runVerificationCase", () => {
  it("passes a driver that answers what was recorded", async () => {
    const driver = new MemoryVerificationDriver([VerificationKind.Identity], clock);
    driver.answer("chk_1", VerificationStatus.Verified);
    const result = await runVerificationCase(
      driver,
      recorded({ status: VerificationStatus.Verified, providerReference: "memory:chk_1" }),
    );
    expect(result).toEqual({
      caseId: "memory.identity",
      answer: expect.objectContaining({ status: VerificationStatus.Verified }),
      mismatches: [],
    });
  });

  it("reports a wrong status and reasons that differ from the recorded ones", async () => {
    const driver = new MemoryVerificationDriver([VerificationKind.Identity], clock);
    driver.answer("chk_1", VerificationStatus.Rejected);
    const { mismatches } = await runVerificationCase(
      driver,
      recorded({ status: VerificationStatus.Verified, reasons: ["document_expired"] }),
    );
    expect(mismatches).toEqual([
      "status: expected verified, got rejected",
      "reasons: expected [document_expired], got [rejected_by_memory_provider]",
    ]);
  });

  it("reports a kind the driver does not answer", async () => {
    const driver = new MemoryVerificationDriver([VerificationKind.Company], clock);
    const result = await runVerificationCase(
      driver,
      recorded({ status: VerificationStatus.Verified }),
    );
    expect(result.answer).toBeNull();
    expect(result.mismatches).toEqual(["supports: the driver does not answer identity"]);
  });

  it("reports a reason that is not a code and a verified check that carries reasons", async () => {
    const driver = new ScriptedVerificationDriver(answerOf({ reasons: ["Name Mismatch"] }));
    const { mismatches } = await runVerificationCase(driver, recorded({}));
    expect(mismatches).toEqual([
      "reasons: Name Mismatch is not a snake_case code",
      "reasons: a verified check carries none",
    ]);
  });

  it("reports a subject fact echoed back, by field name only", async () => {
    const driver = new ScriptedVerificationDriver(answerOf({ providerReference: "id-1234567890" }));
    const { mismatches } = await runVerificationCase(driver, recorded({}));
    expect(mismatches).toEqual(["subject: the answer echoes nationalId"]);
    expect(mismatches.join(" ")).not.toContain("1234567890");
  });

  it("reports an invalid checkedAt", async () => {
    const driver = new ScriptedVerificationDriver(answerOf({ checkedAt: new Date(Number.NaN) }));
    const { mismatches } = await runVerificationCase(driver, recorded({}));
    expect(mismatches).toEqual(["checkedAt: not a valid time"]);
  });

  it("passes a recorded outage refused as verification_unavailable", async () => {
    const driver = new ScriptedVerificationDriver(() => {
      throw VerificationUnavailableError.create();
    });
    const result = await runVerificationCase(driver, recorded({ unavailable: true }));
    expect(result).toEqual({ caseId: "memory.identity", answer: null, mismatches: [] });
  });

  it("reports an outage nobody recorded, and an answer where an outage was", async () => {
    const down = new ScriptedVerificationDriver(() => {
      throw VerificationUnavailableError.create();
    });
    expect((await runVerificationCase(down, recorded({}))).mismatches).toEqual([
      "refused: verification_unavailable (no outage was recorded)",
    ]);
    const up = new ScriptedVerificationDriver(answerOf({}));
    expect((await runVerificationCase(up, recorded({ unavailable: true }))).mismatches).toEqual([
      "unavailable: expected a verification_unavailable refusal, got an answer",
    ]);
  });

  it("rethrows an error that is not a refusal", async () => {
    const broken = new ScriptedVerificationDriver(() => {
      throw new TypeError("driver bug");
    });
    await expect(runVerificationCase(broken, recorded({}))).rejects.toThrow("driver bug");
  });
});
