/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedFieldContext`: `<schema>.<snake class>.<field>`, and a refusal without a module
 *          schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); gap gov7 (stackra-312).
 */
import { describe, expect, it } from "@stackra/testing";

import { encryptedFieldContext } from "#core/functions/encrypted-field-context.function";

describe(encryptedFieldContext, () => {
  it("binds a field to its model key", () => {
    expect(encryptedFieldContext({ schema: "crm", className: "CustomerContact" }, "email")).toBe(
      "crm.customer_contact.email",
    );
  });

  it.each([undefined, "", "Public", "crm-x"])("refuses the schema %j", (schema) => {
    expect(() => encryptedFieldContext({ schema, className: "Contact" }, "email")).toThrow(
      TypeError,
    );
  });
});
