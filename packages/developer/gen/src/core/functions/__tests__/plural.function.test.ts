/**
 * Stackra file contract:
 * Purpose: unit tests of `plural`: the regular English rules for the last word of a snake_case name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 20 and 21).
 */
import { describe, expect, it } from "@stackra/testing";

import { plural } from "#core/functions/plural.function";

describe("plural", () => {
  it("applies the regular rules", () => {
    expect(plural("order")).toBe("orders");
    expect(plural("access_log_entry")).toBe("access_log_entries");
    expect(plural("box")).toBe("boxes");
    expect(plural("batch")).toBe("batches");
    expect(plural("key")).toBe("keys");
  });
});
