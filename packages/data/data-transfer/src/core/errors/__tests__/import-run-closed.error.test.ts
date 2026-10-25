/**
 * Stackra file contract:
 * Purpose: unit tests of `ImportRunClosedError`: kind `conflict` (HTTP 409), code `import_run_closed`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ImportRunClosedError } from "#core/errors/import-run-closed.error";

describe("ImportRunClosedError", () => {
  it("is a conflict refusal carrying its details", () => {
    const error = ImportRunClosedError.create({ runId: "imp_1", state: "finished" });
    expect(isRefusal(error, ImportRunClosedError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(409);
    expect(error.toEnvelope()).toMatchObject({
      code: "import_run_closed",
      retryable: false,
      details: { runId: "imp_1", state: "finished" },
    });
  });
});
