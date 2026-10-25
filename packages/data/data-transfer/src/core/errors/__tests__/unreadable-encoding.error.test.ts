/**
 * Stackra file contract:
 * Purpose: unit tests of `UnreadableEncodingError`: kind `validation` (HTTP 400), code `unreadable_encoding`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnreadableEncodingError } from "#core/errors/unreadable-encoding.error";

describe("UnreadableEncodingError", () => {
  it("is a validation refusal carrying its details", () => {
    const error = UnreadableEncodingError.create({ encoding: "utf-8" });
    expect(isRefusal(error, UnreadableEncodingError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toMatchObject({
      code: "unreadable_encoding",
      retryable: false,
      details: { encoding: "utf-8" },
    });
  });
});
