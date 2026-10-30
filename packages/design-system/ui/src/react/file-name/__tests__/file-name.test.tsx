/**
 * Stackra file contract:
 * Purpose: proves the web FileName isolates an Arabic name right to left and a Latin name left to right, puts the
 *          extension in its own left-to-right isolate, draws a name with no extension as one part, and keeps the
 *          text content equal to the name.
 * Boundary: jsdom; checks the isolates, not the painted order (jsdom has no bidi layout).
 * Runtime: browser
 * Governing contract: ADR 0060 (right-to-left); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { FileName } from "#react/file-name/file-name";

/** The root and its two parts. */
const partsOf = (name: string) => {
  const { container } = render(<FileName name={name} />);
  const root = container.querySelector("[data-slot=file-name]");
  const [base, extension] = root ? [...root.children] : [];
  return { root, base, extension };
};

describe("FileName (web)", () => {
  it("isolates an Arabic name right to left with the extension apart", () => {
    const { root, base, extension } = partsOf("فاتورة-1042.pdf");
    expect(root?.getAttribute("dir")).toBe("rtl");
    expect(root?.textContent).toBe("فاتورة-1042.pdf");
    expect(base?.getAttribute("dir")).toBe("auto");
    expect(base?.textContent).toBe("فاتورة-1042");
    expect(extension?.getAttribute("dir")).toBe("ltr");
    expect(extension?.textContent).toBe(".pdf");
  });

  it("isolates a Latin name left to right", () => {
    const { root, extension } = partsOf("stock-october.xlsx");
    expect(root?.getAttribute("dir")).toBe("ltr");
    expect(extension?.textContent).toBe(".xlsx");
  });

  it("draws a name with no extension as one part", () => {
    const { root, base, extension } = partsOf("مسودة");
    expect(root?.getAttribute("dir")).toBe("rtl");
    expect(base?.textContent).toBe("مسودة");
    expect(extension).toBeUndefined();
  });
});
