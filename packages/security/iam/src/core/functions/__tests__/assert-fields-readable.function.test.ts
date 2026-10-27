/**
 * Stackra file contract:
 * Purpose: unit tests of `assertFieldsReadable`: an aggregate over or filtered on a hidden field, or a path under one,
 *          is refused with `ForbiddenError`; read-only and other fields pass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 3); STA-933.
 */
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { assertFieldsReadable } from "#core/functions/assert-fields-readable.function";

const access = { hidden: ["fee", "medical_notes"], readOnly: ["date_of_birth"] };

describe(assertFieldsReadable, () => {
  it("passes visible and read-only fields", () => {
    expect(() => assertFieldsReadable(["status", "date_of_birth"], access)).not.toThrow();
    expect(() => assertFieldsReadable(["feed"], access)).not.toThrow();
  });

  it("refuses a hidden field and a path under one", () => {
    expect(() => assertFieldsReadable(["medical_notes"], access)).toThrow(ForbiddenError);
    expect(() => assertFieldsReadable(["status", "fee.minor"], access)).toThrow(ForbiddenError);
  });
});
