/**
 * Stackra file contract:
 * Purpose: proves `isolateText` wraps a run in the first-strong, left-to-right or right-to-left isolate and the pop
 *          mark, and leaves the text itself alone.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { isolateText } from "#core/functions/isolate-text.function";

describe("isolateText", () => {
  it("isolates with the mark of each direction, first strong by default", () => {
    expect(isolateText("SKU-104")).toBe("⁨SKU-104⁩");
    expect(isolateText("+966 55 123 4567", "ltr")).toBe("⁦+966 55 123 4567⁩");
    expect(isolateText("مرحبا", "rtl")).toBe("⁧مرحبا⁩");
  });

  it("is just the two marks for an empty run", () => {
    expect([...isolateText("", "ltr")]).toEqual(["⁦", "⁩"]);
  });
});
