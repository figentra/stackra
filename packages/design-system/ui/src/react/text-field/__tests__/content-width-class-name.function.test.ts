/**
 * Stackra file contract:
 * Purpose: proves `contentWidthClassName` puts `w-fit` before the caller's class, alone when there is none, and inside
 *          React Aria's render-function class.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
import { contentWidthClassName } from "#react/text-field/content-width-class-name.function";

describe("contentWidthClassName", () => {
  it("is w-fit alone without a caller class, and w-fit before one", () => {
    expect(contentWidthClassName(undefined)).toBe("w-fit");
    expect(contentWidthClassName("max-w-xs")).toBe("w-fit max-w-xs");
  });

  it("wraps a render-function class", () => {
    const wrapped = contentWidthClassName(() => "max-w-xs");
    expect(typeof wrapped).toBe("function");
    expect((wrapped as (state: unknown) => string)({})).toBe("w-fit max-w-xs");
  });
});
