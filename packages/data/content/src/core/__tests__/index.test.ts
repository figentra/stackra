/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: it exports the one value the template imports (`ContentEntryType`)
 *          and the rest of the public surface, nothing else, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { CustomFieldChoice, CustomFieldDefinition, CustomFieldValue } from "#core/index";

describe("@stackra/content", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "ContentEntryType",
      "CustomFieldDefinitionInvalidError",
      "CustomFieldTakenError",
      "CustomFieldType",
      "CustomFieldsInvalidError",
      "checkCustomFieldDefinition",
      "checkCustomFields",
    ]);
  });

  it("resolves the public types", () => {
    expectTypeOf<CustomFieldChoice["value"]>().toEqualTypeOf<string>();
    expectTypeOf<CustomFieldDefinition["type"]>().toEqualTypeOf<core.CustomFieldType>();
    expectTypeOf<CustomFieldDefinition["choices"]>().toEqualTypeOf<
      readonly CustomFieldChoice[] | undefined
    >();
    expectTypeOf<CustomFieldValue>().toEqualTypeOf<string | number | boolean | readonly string[]>();
  });
});
