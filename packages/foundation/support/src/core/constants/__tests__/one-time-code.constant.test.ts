/**
 * Stackra file contract:
 * Purpose: unit tests of `oneTimeCode`: a code of the asked length that the record does not contain, accepted exactly
 *          once, refused after expiry, locked after the allowed misses, refused for another purpose, and checked with
 *          the issuing key after a rotation.
 * Boundary: test only; keys are fixed in-memory bytes shaped like a `KeyProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ACA-538; STA-934.
 */
import { describe, expect, it } from "@stackra/testing";

import { oneTimeCode } from "#core/constants/one-time-code.constant";
import type { SigningKeySource } from "#core/types/signing-key-source.type";

function source(current: string, ...known: string[]): SigningKeySource {
  const keys = new Map(
    [current, ...known].map((id) => [id, { id, key: new TextEncoder().encode(`pepper-${id}`) }]),
  );
  return {
    byId: async (id) => {
      const key = keys.get(id);
      if (!key) throw new Error("no key");
      return key;
    },
    current: async () => ({ id: current, key: keys.get(current)?.key ?? new Uint8Array() }),
  };
}

const now = new Date("2026-10-27T10:00:00Z");
const expiresAt = new Date("2026-10-27T10:15:00Z");
const issue = (keys = source("k1"), maxAttempts = 3) =>
  oneTimeCode.issue(keys, { purpose: "pickup", length: 6, expiresAt, maxAttempts });

describe("oneTimeCode", () => {
  it("issues a code of the asked length and stores no plaintext", async () => {
    const { code, record } = await issue();
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(record)).not.toContain(code);
    expect(record).toMatchObject({
      keyId: "k1",
      attemptsLeft: 3,
      usedAt: null,
      expiresAt: expiresAt.toISOString(),
    });
  });

  it("accepts the code once", async () => {
    const keys = source("k1");
    const { code, record } = await issue(keys);
    const first = await oneTimeCode.verify(keys, record, code, { purpose: "pickup", now });
    expect(first.ok).toBe(true);
    expect(first.record.usedAt).toBe(now.toISOString());
    const second = await oneTimeCode.verify(keys, first.record, code, { purpose: "pickup", now });
    expect(second).toMatchObject({ ok: false, reason: "used" });
  });

  it("refuses an expired code without spending an attempt", async () => {
    const keys = source("k1");
    const { code, record } = await issue(keys);
    const check = await oneTimeCode.verify(keys, record, code, {
      purpose: "pickup",
      now: expiresAt,
    });
    expect(check).toEqual({ ok: false, reason: "expired", record });
  });

  it("locks after the allowed misses", async () => {
    const keys = source("k1");
    const { code, record } = await issue(keys, 2);
    const wrong = code === "000000" ? "111111" : "000000";
    const miss1 = await oneTimeCode.verify(keys, record, wrong, { purpose: "pickup", now });
    expect(miss1).toMatchObject({ ok: false, reason: "mismatch", record: { attemptsLeft: 1 } });
    const miss2 = await oneTimeCode.verify(keys, miss1.record, wrong, { purpose: "pickup", now });
    expect(miss2.record.attemptsLeft).toBe(0);
    const locked = await oneTimeCode.verify(keys, miss2.record, code, { purpose: "pickup", now });
    expect(locked).toMatchObject({ ok: false, reason: "locked" });
  });

  it("refuses the code for another purpose", async () => {
    const keys = source("k1");
    const { code, record } = await issue(keys);
    const check = await oneTimeCode.verify(keys, record, code, { purpose: "gate", now });
    expect(check).toMatchObject({ ok: false, reason: "mismatch" });
  });

  it("verifies with the issuing key after a rotation, and refuses an unknown key", async () => {
    const { code, record } = await issue(source("old"));
    const rotated = await oneTimeCode.verify(source("new", "old"), record, code, {
      purpose: "pickup",
      now,
    });
    expect(rotated.ok).toBe(true);
    const lost = await oneTimeCode.verify(source("new"), record, code, { purpose: "pickup", now });
    expect(lost).toMatchObject({ ok: false, reason: "unknown_key" });
  });

  it("refuses bad issue options", async () => {
    const keys = source("k1");
    await expect(
      oneTimeCode.issue(keys, { purpose: "pickup", length: 3, expiresAt, maxAttempts: 3 }),
    ).rejects.toThrow(RangeError);
    await expect(
      oneTimeCode.issue(keys, { purpose: "pickup", length: 6, expiresAt, maxAttempts: 0 }),
    ).rejects.toThrow(RangeError);
    await expect(
      oneTimeCode.issue(keys, { purpose: "a\nb", length: 6, expiresAt, maxAttempts: 3 }),
    ).rejects.toThrow(RangeError);
  });
});
