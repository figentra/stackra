/**
 * Stackra file contract:
 * Purpose: proves the web TamoMenu offers the text actions with Translate turned by the text's script, only Draft on an
 *          empty text, the contributed actions, and reports the action chosen.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoMenu } from "#react/tamo-menu/tamo-menu";

const open = () => fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));

describe("TamoMenu (web)", () => {
  it("offers the actions, translating Arabic text to English, and reports the choice", () => {
    const onAction = vi.fn();
    render(
      <TamoMenu
        text="مرحبا"
        hasContinue
        actions={[{ id: "seo", label: "Write an SEO title" }]}
        onAction={onAction}
      />,
    );
    open();
    expect(screen.getByRole("menuitem", { name: "Translate to English" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Continue writing" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Write an SEO title" }));
    expect(onAction).toHaveBeenCalledWith("seo");
  });

  it("offers only Draft on an empty text", () => {
    render(<TamoMenu text="" onAction={vi.fn()} />);
    open();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Draft with Tamo",
    ]);
  });
});
