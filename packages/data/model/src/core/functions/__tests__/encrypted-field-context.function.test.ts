/**
 * Stackra file contract:
 * Purpose: unit tests of `encryptedFieldContext`: `<schema>.<snake class>.<field>`, `@<scope id>` appended for a
 *          scope-bound row, and a refusal without a module schema or with an empty scope id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); gap gov7 (stackra-312); gap gov8 (stackra-330).
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

  it("binds a scope-bound field to its row's scope, and refuses an empty scope id", () => {
    expect(encryptedFieldContext({ schema: "ai", className: "Message" }, "content", "scp_1")).toBe(
      "ai.message.content@scp_1",
    );
    expect(() =>
      encryptedFieldContext({ schema: "ai", className: "Message" }, "content", ""),
    ).toThrow(TypeError);
  });
});
