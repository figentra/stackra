/**
 * Stackra file contract:
 * Purpose: unit tests of `ImportRunNotFoundError`: kind `not_found` (HTTP 404), code `import_run_not_found`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ImportRunNotFoundError } from "#core/errors/import-run-not-found.error";

describe("ImportRunNotFoundError", () => {
  it("is a not_found refusal carrying its details", () => {
    const error = ImportRunNotFoundError.create({ runId: "imp_1" });
    expect(isRefusal(error, ImportRunNotFoundError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(404);
    expect(error.toEnvelope()).toMatchObject({
      code: "import_run_not_found",
      retryable: false,
      details: { runId: "imp_1" },
    });
  });
});
