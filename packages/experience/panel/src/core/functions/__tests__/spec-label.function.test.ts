/**
 * Stackra file contract:
 * Purpose: unit tests of `specLabel`: a spec's own label wins (translated when it is a key); without one, the action's
 *          derived label key on the resource its key names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { specLabel } from "#core/functions/spec-label.function";

const t = (key: string) => `<${key}>`;

describe("specLabel", () => {
  it("keeps the spec's own words", () => {
    expect(specLabel({ action: "orders.order.cancel@1", label: "Cancel" }, t)).toBe("Cancel");
    expect(specLabel({ action: "orders.order.cancel@1", label: "orders::x.cancel" }, t)).toBe(
      "<orders::x.cancel>",
    );
  });

  it("derives the label key from the action key", () => {
    expect(specLabel({ action: "orders.order.cancel@1" }, t)).toBe(
      "<orders::resources.order.actions.cancel>",
    );
  });
});
