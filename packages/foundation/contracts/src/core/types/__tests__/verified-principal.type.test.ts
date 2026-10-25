/**
 * Stackra file contract:
 * Purpose: type tests of `VerifiedPrincipal`: a user id, a verified address and a locale, with the id and the address
 *          checked by their own types.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0206 (identity).
 */
import { describe, expect, it } from "@stackra/testing";

import type { VerifiedPrincipal } from "#core/types/verified-principal.type";

describe("VerifiedPrincipal", () => {
  it("holds the id, the verified address and the locale", () => {
    const principal: VerifiedPrincipal = { id: "usr_a", email: "a@acme.example", locale: "ar-SA" };
    expect(principal).toEqual({ id: "usr_a", email: "a@acme.example", locale: "ar-SA" });
  });

  it("refuses a non-user id and a non-address", () => {
    // @ts-expect-error -- a principal's id is a user id
    const wrongId: VerifiedPrincipal = { id: "ord_a", email: "a@acme.example", locale: "en" };
    // @ts-expect-error -- not an email address
    const wrongEmail: VerifiedPrincipal = { id: "usr_a", email: "a", locale: "en" };
    expect([wrongId.locale, wrongEmail.locale]).toEqual(["en", "en"]);
  });
});
