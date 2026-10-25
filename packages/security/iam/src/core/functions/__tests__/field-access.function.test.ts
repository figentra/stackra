/**
 * Stackra file contract:
 * Purpose: unit tests of `redactFields` and `assertFieldsWritable`: a read drops hidden fields only; a write touching a
 *          read-only or hidden field is refused with `ForbiddenError`, any other passes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decision 3); STA-595.
 */
import { ForbiddenError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { assertFieldsWritable } from "#core/functions/assert-fields-writable.function";
import { redactFields } from "#core/functions/redact-fields.function";

const access = { hidden: ["medical_notes"], readOnly: ["date_of_birth"] };

describe("field access helpers", () => {
  it("drops hidden fields from a read", () => {
    expect(
      redactFields({ name: "Omar", medical_notes: "asthma", date_of_birth: "2014-03-02" }, access),
    ).toEqual({ name: "Omar", date_of_birth: "2014-03-02" });
  });

  it("refuses a write to a read-only or hidden field", () => {
    expect(() => assertFieldsWritable({ name: "Omar" }, access)).not.toThrow();
    expect(() => assertFieldsWritable({ date_of_birth: "2014-03-03" }, access)).toThrow(
      ForbiddenError,
    );
    expect(() => assertFieldsWritable({ medical_notes: "" }, access)).toThrow(ForbiddenError);
  });
});
