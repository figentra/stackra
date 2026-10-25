/**
 * Stackra file contract:
 * Purpose: unit tests of `HasAttachments`: it adds no field and marks the model in the trait registry.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0222; ADR 0321.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { traitsOf } from "#core/functions/traits-of.function";
import { HasAttachments } from "#core/traits/has-attachments.trait";

class Expense extends Model.with(HasAttachments) {}

describe("HasAttachments", () => {
  it("adds no field and marks the model", () => {
    expect(Object.keys(new Expense())).toEqual([]);
    expect(traitsOf(Expense)).toEqual([{ name: "has_attachments", options: {} }]);
  });
});
