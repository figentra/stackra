/**
 * Stackra file contract:
 * Purpose: unit tests of `BridgeRejectedError`: a refusal of kind `Forbidden` with code `bridge_rejected`, category `forbidden` (HTTP 403),
 *          not retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { BridgeRejectedError } from "#core/errors/bridge-rejected.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("BridgeRejectedError", () => {
  it("is a Forbidden refusal with code bridge_rejected", () => {
    const refused = BridgeRejectedError.create();
    expect(isRefusal(refused, BridgeRejectedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("bridge_rejected");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(403);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(BridgeRejectedError.envelope()).toEqual({
      code: "bridge_rejected",
      category: "forbidden",
      retryable: false,
    });
  });
});
