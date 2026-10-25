/**
 * Stackra file contract:
 * Purpose: unit tests of `LiveReadOnlyError`: a Conflict refusal with code `live_read_only`, not retryable, no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0359 (decision 3); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { LiveReadOnlyError } from "#core/errors/live-read-only.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("LiveReadOnlyError", () => {
  it("is a Conflict refusal with code live_read_only", () => {
    const refused = LiveReadOnlyError.create();
    expect(isRefusal(refused, LiveReadOnlyError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Conflict);
    expect(refused.code).toBe("live_read_only");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(409);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(LiveReadOnlyError.envelope()).toEqual({
      code: "live_read_only",
      category: "conflict",
      retryable: false,
    });
  });
});
