/**
 * Stackra file contract:
 * Purpose: unit tests of `NotOwnPrincipalError`: a non-retryable `forbidden` refusal, code `not_own_principal`, with no
 *          details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0232; ADR 0328.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { NotOwnPrincipalError } from "#core/errors/not-own-principal.error";

describe("NotOwnPrincipalError", () => {
  it("is forbidden and carries no details", () => {
    const refusal = NotOwnPrincipalError.create();
    expect(refusal.kind).toBe(ErrorKind.Forbidden);
    expect(refusal.code).toBe("not_own_principal");
    expect(refusal.details).toEqual({});
  });
});
