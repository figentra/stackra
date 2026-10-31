/**
 * Stackra file contract:
 * Purpose: proves the web TamoButton says "Ask Tamo" by default, is named by its label when icon-only, reports presses and
 *          is busy while working.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoButton } from "#react/tamo-button/tamo-button";

describe("TamoButton (web)", () => {
  it("shows the catalogue's words and reports a press", () => {
    const onPress = vi.fn();
    render(<TamoButton onPress={onPress} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("is named by its label when icon-only, and busy while working", () => {
    render(<TamoButton isIconOnly label="Improve" status="working" />);
    const button = screen.getByRole("button", { name: "Improve" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent).toBe("");
  });
});
