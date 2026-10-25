/**
 * Stackra file contract:
 * Purpose: unit tests of `FormStep.of`: a step holds its fields, laid on a grid when one is given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 11); ADR 0294 (decision 23).
 */
import { describe, expect, it } from "@stackra/testing";

import { FormField } from "#core/constants/form-field.constant";
import { FormStep } from "#core/constants/form-step.constant";

describe("FormStep", () => {
  it("builds a step, on a grid when asked", () => {
    const title = FormField.from("title", { span: 2 });
    expect(FormStep.of("seo", [title])).toEqual({ name: "seo", fields: [title] });
    expect(FormStep.of("basics", [title], { grid: 2 })).toEqual({
      name: "basics",
      fields: [{ kind: "grid", columns: 2, fields: [title] }],
    });
  });
});
