/**
 * Stackra file contract:
 * Purpose: unit tests of `FormField`: field, upload, repeater, grid and steps nodes, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 11); ADR 0294 (decision 23).
 */
import { describe, expect, it } from "@stackra/testing";

import { FormField } from "#core/constants/form-field.constant";

class AttachImageAction {}
class ListCollectionsQuery {}

describe("FormField", () => {
  it("builds frozen form nodes", () => {
    expect(
      FormField.from("collections", { options: ListCollectionsQuery, optionLabel: "title" }),
    ).toEqual({
      kind: "value",
      key: "collections",
      options: ListCollectionsQuery,
      optionLabel: "title",
    });
    expect(FormField.upload("images", { action: AttachImageAction, maxBytes: 5 })).toEqual({
      kind: "upload",
      key: "images",
      action: AttachImageAction,
      maxBytes: 5,
    });
    const repeater = FormField.repeater("variants", [FormField.from("sku")]);
    expect(repeater).toEqual({
      kind: "repeater",
      key: "variants",
      fields: [{ kind: "value", key: "sku" }],
    });
    expect(FormField.grid(2, [])).toEqual({ kind: "grid", columns: 2, fields: [] });
    expect(FormField.steps("product", [{ name: "basics", fields: [] }])).toEqual({
      kind: "steps",
      name: "product",
      steps: [{ name: "basics", fields: [] }],
    });
    expect(Object.isFrozen(repeater)).toBe(true);
  });
});
