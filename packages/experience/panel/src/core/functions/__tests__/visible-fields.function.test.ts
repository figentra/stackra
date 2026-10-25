/**
 * Stackra file contract:
 * Purpose: unit tests of `visibleFields`: developer mode shows every element as given; normal mode keeps essential
 *          fields and uploads, a repeater with an essential field inside, and grids and steps cut to their essential
 *          fields, dropping those left empty.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { FormField } from "#core/constants/form-field.constant";
import { visibleFields } from "#core/functions/visible-fields.function";

class AttachAction {}

const fields = [
  FormField.from("title", { essential: true }),
  FormField.from("slug"),
  FormField.upload("image", { action: AttachAction, essential: true }),
  FormField.repeater("variants", [FormField.from("sku", { essential: true })]),
  FormField.repeater("tags", [FormField.from("tag")]),
  FormField.grid(2, [FormField.from("price", { essential: true }), FormField.from("cost")]),
  FormField.grid(2, [FormField.from("weight")]),
  FormField.steps("product", [
    { name: "basics", fields: [FormField.from("name", { essential: true })] },
    { name: "advanced", fields: [FormField.from("hs_code")] },
  ]),
];

describe("visibleFields", () => {
  it("shows every element in developer mode", () => {
    expect(visibleFields(fields, "developer")).toBe(fields);
  });

  it("shows only what is essential in normal mode", () => {
    expect(visibleFields(fields, "normal")).toEqual([
      { kind: "value", key: "title", essential: true },
      { kind: "upload", key: "image", action: AttachAction, essential: true },
      fields[3],
      { kind: "grid", columns: 2, fields: [{ kind: "value", key: "price", essential: true }] },
      {
        kind: "steps",
        name: "product",
        steps: [{ name: "basics", fields: [{ kind: "value", key: "name", essential: true }] }],
      },
    ]);
  });
});
