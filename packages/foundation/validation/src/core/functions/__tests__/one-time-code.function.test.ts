/**
 * Stackra file contract:
 * Purpose: unit tests of `issueOneTimeCode` and `verifyOneTimeCode`: a code of the policy's length and alphabet whose
 *          record holds no code; the right code passes once; a wrong one counts an attempt and locks at the limit;
 *          expiry; a code bound to another subject or pepper fails; policy bounds.
 * Boundary: test only. The pepper is a test value, never a real secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; conflict #2; OS-184.
 */
import { describe, expect, it } from "@stackra/testing";

import { OneTimeCodeResult } from "#core/enums/one-time-code-result.enum";
import { constantTimeEqual } from "#core/functions/constant-time-equal.function";
import { issueOneTimeCode } from "#core/functions/issue-one-time-code.function";
import { verifyOneTimeCode } from "#core/functions/verify-one-time-code.function";

const now = new Date("2026-10-25T10:00:00Z");
const policy = { length: 6, ttlSeconds: 300, maxAttempts: 3 };
const pepper = "test-pepper";
const issue = () => issueOneTimeCode({ purpose: "login", subject: "usr_1", policy, pepper, now });

describe("one-time codes", () => {
  it("issues a digit code and stores only its digest", async () => {
    const { code, record } = await issue();
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(record)).not.toContain(code);
    expect(record.expiresAt.toISOString()).toBe("2026-10-25T10:05:00.000Z");
    expect(record.attempts).toBe(0);
  });

  it("accepts the right code once", async () => {
    const { code, record } = await issue();
    const first = await verifyOneTimeCode({ record, code, policy, pepper, now });
    expect(first.result).toBe(OneTimeCodeResult.Valid);
    const again = await verifyOneTimeCode({ record: first.record, code, policy, pepper, now });
    expect(again.result).toBe(OneTimeCodeResult.Locked);
  });

  it("counts wrong tries and locks at the limit", async () => {
    const { code, record } = await issue();
    const wrong = code === "000000" ? "111111" : "000000";
    let state = record;
    const results: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const outcome = await verifyOneTimeCode({ record: state, code: wrong, policy, pepper, now });
      results.push(outcome.result);
      state = outcome.record;
    }
    expect(results).toEqual(["invalid", "invalid", "locked"]);
    expect((await verifyOneTimeCode({ record: state, code, policy, pepper, now })).result).toBe(
      "locked",
    );
  });

  it("expires, and binds the code to its subject and pepper", async () => {
    const { code, record } = await issue();
    const later = new Date(now.getTime() + 300_000);
    expect((await verifyOneTimeCode({ record, code, policy, pepper, now: later })).result).toBe(
      "expired",
    );
    const other = { ...record, subject: "usr_2" };
    expect((await verifyOneTimeCode({ record: other, code, policy, pepper, now })).result).toBe(
      "invalid",
    );
    expect((await verifyOneTimeCode({ record, code, policy, pepper: "other", now })).result).toBe(
      "invalid",
    );
  });

  it("draws from a custom alphabet and refuses bad policies", async () => {
    const { code } = await issueOneTimeCode({
      purpose: "pickup",
      subject: "ord_1",
      policy: { ...policy, length: 8, alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" },
      pepper,
      now,
    });
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    await expect(
      issueOneTimeCode({
        purpose: "x",
        subject: "y",
        policy: { ...policy, length: 3 },
        pepper,
        now,
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      issueOneTimeCode({
        purpose: "x",
        subject: "y",
        policy: { ...policy, alphabet: "aa" },
        pepper,
        now,
      }),
    ).rejects.toThrow(RangeError);
    await expect(
      issueOneTimeCode({ purpose: "x", subject: "y", policy, pepper: "", now }),
    ).rejects.toThrow(TypeError);
  });

  it("compares in constant time", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "ab")).toBe(false);
  });
});
