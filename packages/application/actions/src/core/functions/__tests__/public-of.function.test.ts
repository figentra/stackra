/**
 * Stackra file contract:
 * Purpose: unit tests of `publicOf`: absent when the operation is not public; the scopes default to the operation's
 *          permission; a selector may cover an operation below L3 with no approval or step-up, and nothing else; an
 *          unknown risk is exact-only.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (amendment of 2026-11-09, R1); STA-2646.
 */
import { describe, expect, it } from "@stackra/testing";

import { publicOf } from "#core/functions/public-of.function";

describe(publicOf, () => {
  it("is absent for an operation that is not public", () => {
    expect(publicOf({}, "payments.payment.read", "L1")).toBeUndefined();
  });

  it("takes the operation's permission as its scope, or the scopes it names", () => {
    expect(publicOf({ public: true }, "payments.payment.read", "L1")).toEqual({
      scopes: ["payments.payment.read"],
      exactOnly: false,
    });
    expect(
      publicOf({ public: { scopes: ["a.b.c", "d.e.f"] } }, "payments.payment.read", "L1")?.scopes,
    ).toEqual(["a.b.c", "d.e.f"]);
  });

  it("is exact-only at L3 and above, with approval or step-up, and for an unknown risk", () => {
    expect(publicOf({ public: true }, "p.q.r", "L3")?.exactOnly).toBe(true);
    expect(publicOf({ public: true, approval: true }, "p.q.r", "L1")?.exactOnly).toBe(true);
    expect(publicOf({ public: true, stepUp: "aal2" }, "p.q.r", "L1")?.exactOnly).toBe(true);
    expect(publicOf({ public: true }, "p.q.r", undefined)?.exactOnly).toBe(true);
    expect(publicOf({ public: true, approval: false }, "p.q.r", "l2")?.exactOnly).toBe(false);
  });
});
