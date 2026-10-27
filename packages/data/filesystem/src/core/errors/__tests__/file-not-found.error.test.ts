/**
 * Stackra file contract:
 * Purpose: unit tests of `FileNotFoundError`: a `NotFound` refusal naming the missing key, with the key on `path`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (R3); STA-344.
 */
import { describe, expect, it } from "@stackra/testing";

import { FileNotFoundError } from "#core/errors/file-not-found.error";

describe("FileNotFoundError", () => {
  it("is a not-found refusal carrying the key", () => {
    const error = FileNotFoundError.create({ path: "invoices/inv_01.pdf" });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("FileNotFoundError");
    expect(error.path).toBe("invoices/inv_01.pdf");
    expect(error.code).toBe("file_not_found");
    expect(error.category).toBe("not_found");
    expect(error.details).toEqual({ path: "invoices/inv_01.pdf" });
  });
});
