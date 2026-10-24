/**
 * Stackra file contract:
 * Purpose: unit tests of `FileNotFoundError`: a plain `Error` naming the missing key, with the key on `path`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { FileNotFoundError } from "#core/errors/file-not-found.error";

describe("FileNotFoundError", () => {
  it("is a named Error carrying the key", () => {
    const error = new FileNotFoundError("invoices/inv_01.pdf");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("FileNotFoundError");
    expect(error.path).toBe("invoices/inv_01.pdf");
    expect(error.message).toBe('No file is stored under "invoices/inv_01.pdf"');
  });
});
