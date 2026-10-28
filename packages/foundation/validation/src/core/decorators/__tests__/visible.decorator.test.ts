/**
 * Stackra file contract:
 * Purpose: unit tests of `@Visible({ audience })`: it records the frozen audiences, and refuses an empty list, a
 *          repeated code and a code that is not an `OutputAudience`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0095 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Visible } from "#core/decorators/visible.decorator";
import { OutputAudience } from "#core/enums/output-audience.enum";

class CustomerView extends Schema {
  @Visible({ audience: [OutputAudience.App, OutputAudience.Admin] })
  rating = 0;
}

describe("Visible", () => {
  it("records the audiences of the field", () => {
    expect(Visible.members(CustomerView).get("rating")).toEqual({ audience: ["app", "admin"] });
  });

  it("refuses an empty, repeated or unknown audience", () => {
    expect(() => Visible({ audience: [] })).toThrow(/at least one/);
    expect(() => Visible({ audience: [OutputAudience.App, OutputAudience.App] })).toThrow(/twice/);
    expect(() => Visible({ audience: ["robots" as OutputAudience] })).toThrow(
      /OutputAudience codes/,
    );
  });
});
