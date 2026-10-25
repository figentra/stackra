/**
 * Stackra file contract:
 * Purpose: unit tests of `NotAMemberError`: a non-retryable `forbidden` refusal, code `not_a_member`, naming the
 *          principal by public id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0232; ADR 0328.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NotAMemberError } from "#core/errors/not-a-member.error";

describe("NotAMemberError", () => {
  it("is forbidden and names the principal", () => {
    const refusal = NotAMemberError.create({ principalId: "usr_2" });
    expect(refusal.kind).toBe(ErrorKind.Forbidden);
    expect(refusal.code).toBe("not_a_member");
    expect(refusal.principalId).toBe("usr_2");
  });
});
