/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchCursorInvalidError`: a refusal of kind `Validation` with code `search_cursor_invalid`
 *          (HTTP 400), not retryable, with no details and the field error on `cursor`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";

describe("SearchCursorInvalidError", () => {
  it("is a Validation refusal with code search_cursor_invalid on the cursor field", () => {
    const refused = SearchCursorInvalidError.create(
      {},
      { fieldErrors: { cursor: "search_cursor_invalid" } },
    );
    expect(isRefusal(refused, SearchCursorInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("search_cursor_invalid");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(refused.fieldErrors).toEqual({ cursor: "search_cursor_invalid" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });
});
