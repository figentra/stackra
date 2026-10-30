/**
 * Stackra file contract:
 * Purpose: proves the web VisuallyHidden keeps its text in the accessibility tree while clipping it off screen, and
 *          passes React Aria's `elementType` through.
 * Boundary: jsdom with real React Aria; styles are inline, so they are read.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { VisuallyHidden } from "#react/visually-hidden/visually-hidden";

describe("VisuallyHidden (web)", () => {
  it("is read but clipped off screen", () => {
    render(
      <button type="button">
        <span aria-hidden="true">×</span>
        <VisuallyHidden>Remove item</VisuallyHidden>
      </button>,
    );
    expect(screen.getByRole("button", { name: "Remove item" })).toBeTruthy();
    const hidden = screen.getByText("Remove item");
    expect(hidden.style.position).toBe("absolute");
    expect(hidden.style.width).toBe("1px");
    expect(hidden.getAttribute("data-slot")).toBe("visually-hidden");
  });

  it("renders the element type asked for", () => {
    render(<VisuallyHidden elementType="h2">Cart</VisuallyHidden>);
    expect(screen.getByRole("heading", { name: "Cart" })).toBeTruthy();
  });
});
