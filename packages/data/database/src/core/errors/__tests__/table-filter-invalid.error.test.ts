/**
 * Stackra file contract:
 * Purpose: unit tests of `TableFilterInvalidError`: a `validation` refusal with the code `table_filter_invalid` that
 *          carries the path and the reason.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rule 2); ADR 0140; ADR 0022; ADR 0269.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TableFilterInvalidError } from "#core/errors/table-filter-invalid.error";

describe("TableFilterInvalidError", () => {
  it("is a validation refusal naming the path and the reason", () => {
    const error = TableFilterInvalidError.create({
      key: "total",
      reason: "a range needs from or to",
    });
    expect(isRefusal(error, TableFilterInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(error.toEnvelope()).toMatchObject({
      code: "table_filter_invalid",
      details: { key: "total", reason: "a range needs from or to" },
    });
  });
});
