/**
 * Stackra file contract:
 * Purpose: proves the web Highlight marks the matches, keeps the text unchanged (Arabic with its diacritics), and
 *          gives the marks no padding.
 * Boundary: jsdom.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { Highlight } from "#react/highlight/highlight";

describe("Highlight (web)", () => {
  it("marks Arabic matches and keeps the text whole", () => {
    const text = "شركة مُحَمَّد للتجارة";
    const { container } = render(<Highlight query="محمد">{text}</Highlight>);
    expect(container.textContent).toBe(text);
    const mark = container.querySelector("mark");
    expect(mark?.textContent).toBe("مُحَمَّد");
    expect(mark?.className).toContain("p-0");
  });
});
