/**
 * Stackra file contract:
 * Purpose: unit tests of `PackRejectedError`: a FailedPrecondition refusal with code pack_rejected that carries its reason and pack, and requires the reason.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackRejectedError } from "#core/errors/pack-rejected.error";

describe("PackRejectedError", () => {
  it("is a FailedPrecondition refusal with code pack_rejected", () => {
    const refused = PackRejectedError.create({ reason: PackRejection.HashMismatch });
    expect(isRefusal(refused, PackRejectedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("pack_rejected");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });

  it("names the reason and the pack in its envelope", () => {
    expect(
      PackRejectedError.envelope({ reason: PackRejection.KeyUnknown, pack: "xa@1.0.0" }),
    ).toEqual({
      code: "pack_rejected",
      category: "precondition_failed",
      retryable: false,
      details: { reason: "key_unknown", pack: "xa@1.0.0" },
    });
  });

  it("requires the reason", () => {
    // @ts-expect-error -- `reason` is required
    expect(PackRejectedError.create().code).toBe("pack_rejected");
  });
});
