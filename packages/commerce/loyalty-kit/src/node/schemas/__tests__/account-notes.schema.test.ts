/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountNotes`: a registered shape whose two fields are optional, the reason at most 500
 *          characters.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";

import { AccountNotes } from "#node/schemas/account-notes.schema";

describe("AccountNotes", () => {
  it("takes either field or none, and bounds the reason", () => {
    expect({ ...AccountNotes.create({}) }).toEqual({});
    expect(AccountNotes.create({ reason: "review" }).reason).toBe("review");
    expect(() => AccountNotes.create({ reason: "x".repeat(501) })).toThrow();
  });
});
