/**
 * Stackra file contract:
 * Purpose: unit tests of `ImportUndoExpiredError`: kind `precondition_failed` (HTTP 412), code `import_undo_expired`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ImportUndoExpiredError } from "#core/errors/import-undo-expired.error";

describe("ImportUndoExpiredError", () => {
  it("is a precondition_failed refusal carrying its details", () => {
    const error = ImportUndoExpiredError.create({
      runId: "imp_1",
      settledAt: "2026-10-01T00:00:00.000Z",
    });
    expect(isRefusal(error, ImportUndoExpiredError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(412);
    expect(error.toEnvelope()).toMatchObject({
      code: "import_undo_expired",
      retryable: false,
      details: { runId: "imp_1", settledAt: "2026-10-01T00:00:00.000Z" },
    });
  });
});
