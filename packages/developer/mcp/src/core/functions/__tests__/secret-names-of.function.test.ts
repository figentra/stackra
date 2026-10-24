/**
 * Stackra file contract:
 * Purpose: unit tests of `secretNamesOf`: every distinct SCREAMING_SNAKE `$NAME`, embedded or alone, in first-seen
 *          order; lower-case and `${NAME}` forms are not references.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { secretNamesOf } from "#core/functions/secret-names-of.function";

describe("secretNamesOf", () => {
  it("names each referenced secret once, in order", () => {
    expect(
      secretNamesOf([
        "--api-key",
        "$CONTEXT7_API_KEY",
        "x-token:$HEROUI_PERSONAL_TOKEN",
        "$CONTEXT7_API_KEY",
      ]),
    ).toEqual(["CONTEXT7_API_KEY", "HEROUI_PERSONAL_TOKEN"]);
  });

  it("ignores text that is not a reference", () => {
    expect(secretNamesOf(["$lower", "${BRACED}", "price $5", "plain"])).toEqual([]);
  });
});
