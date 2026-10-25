/**
 * Stackra file contract:
 * Purpose: unit tests of `toRefuseWith`: it passes for a thrown refusal (`rejects`), a failed result
 *          `{ ok: false, error }` and an envelope; it checks the code, only the details the expected refusal sets
 *          (dates by time) and its field errors; `.not` inverts it; the failure message names both refusals; and an
 *          expected value that is not a refusal is refused.
 * Boundary: test only; importing the matcher registers it with `expect`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0232 (decision 7); ADR 0140.
 */
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind, ForbiddenError, Refusal } from "#core/index";
import { refusal } from "#testing/functions/refusal.function";
import { toRefuseWith } from "#testing/to-refuse-with.matcher";

class InsufficientPointsError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  balance!: number;
  requested!: number;
}

class PointsExpiredError extends Refusal({ kind: ErrorKind.FailedPrecondition, retryable: false }) {
  expiredAt!: Date;
}

/** A call that refuses as the loyalty service does. */
async function redeem(points: number): Promise<number> {
  if (points > 100) throw InsufficientPointsError.create({ balance: 100, requested: points });
  return points;
}

describe(toRefuseWith, () => {
  it("passes for a thrown refusal with the expected code", async () => {
    await expect(redeem(101)).rejects.toRefuseWith(refusal(InsufficientPointsError));
    await expect(redeem(101)).rejects.not.toRefuseWith(refusal(ForbiddenError));
  });

  it("passes for a failed result and for an envelope", () => {
    const refused = InsufficientPointsError.create({ balance: 0, requested: 1 });
    expect({ ok: false, error: refused }).toRefuseWith(refusal(InsufficientPointsError));
    expect({ ok: false, error: refused.toEnvelope() }).toRefuseWith(
      refusal(InsufficientPointsError),
    );
    expect(refused.toEnvelope()).toRefuseWith(refusal(InsufficientPointsError, { requested: 1 }));
  });

  it("fails for anything that is not a refusal", () => {
    expect({ ok: true, data: 1 }).not.toRefuseWith(refusal(ForbiddenError));
    expect(new Error("forbidden")).not.toRefuseWith(refusal(ForbiddenError));
    expect(undefined).not.toRefuseWith(refusal(ForbiddenError));
  });

  it("checks only the details the expected refusal sets", () => {
    const refused = InsufficientPointsError.create({ balance: 100, requested: 101 });
    expect(refused).toRefuseWith(refusal(InsufficientPointsError, { requested: 101 }));
    expect(refused).not.toRefuseWith(refusal(InsufficientPointsError, { requested: 5 }));
  });

  it("compares dates by time", () => {
    const refused = PointsExpiredError.create({ expiredAt: new Date("2026-10-01T00:00:00Z") });
    expect(refused).toRefuseWith(
      refusal(PointsExpiredError, { expiredAt: new Date("2026-10-01T00:00:00Z") }),
    );
    expect(refused).not.toRefuseWith(
      refusal(PointsExpiredError, { expiredAt: new Date("2026-10-02T00:00:00Z") }),
    );
  });

  it("checks field errors when the expected refusal has them", () => {
    const refused = InsufficientPointsError.create(
      { balance: 0, requested: 1 },
      { fieldErrors: { redeemPoints: "insufficient_points" } },
    );
    expect(refused).toRefuseWith(
      refusal(InsufficientPointsError, { fields: { redeemPoints: "insufficient_points" } }),
    );
    expect(refused).not.toRefuseWith(
      refusal(InsufficientPointsError, { fields: { points: "insufficient_points" } }),
    );
    expect(refused).toRefuseWith(refusal(InsufficientPointsError));
  });

  it("names both refusals when it fails", () => {
    expect(() =>
      expect(refusal(ForbiddenError)).toRefuseWith(refusal(InsufficientPointsError)),
    ).toThrow(/to be refused with \{"code":"insufficient_points".*received \{"code":"forbidden"/);
  });

  it("refuses an expected value that is not a refusal", () => {
    const notARefusal = new Error("x") as unknown as ForbiddenError;
    expect(() => expect(refusal(ForbiddenError)).toRefuseWith(notARefusal)).toThrow(TypeError);
  });

  it("is the registered matcher", () => {
    expect(toRefuseWith.name).toBe("toRefuseWith");
  });
});
