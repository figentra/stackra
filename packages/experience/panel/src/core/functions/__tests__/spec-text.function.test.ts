/**
 * Stackra file contract:
 * Purpose: unit tests of `specText`: an i18n key goes through the translator, plain words stay as written.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { specText } from "#core/functions/spec-text.function";

describe("specText", () => {
  it("translates a key and keeps plain words", () => {
    const t = vi.fn((key: string) => `<${key}>`);
    expect(specText("orders::actions.order.cancel.label", t)).toBe(
      "<orders::actions.order.cancel.label>",
    );
    expect(specText("Cancel order", t)).toBe("Cancel order");
    expect(specText("::odd", t)).toBe("::odd");
    expect(t).toHaveBeenCalledTimes(1);
  });
});
