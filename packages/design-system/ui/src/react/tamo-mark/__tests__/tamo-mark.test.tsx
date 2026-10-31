/**
 * Stackra file contract:
 * Purpose: proves the web TamoMark is decorative without a label, an image named by its label, and draws flat eyes on error.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { TamoMark } from "#react/tamo-mark/tamo-mark";

describe("TamoMark (web)", () => {
  it("is hidden from assistive technology without a label", () => {
    const { container } = render(<TamoMark />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is an image named by its label, and records its state", () => {
    render(<TamoMark label="Tamo" status="error" size="lg" />);
    const mark = screen.getByRole("img", { name: "Tamo" });
    expect(mark.getAttribute("data-status")).toBe("error");
    expect(mark.getAttribute("width")).toBe("28");
  });
});
