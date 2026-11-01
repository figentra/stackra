/**
 * Stackra file contract:
 * Purpose: proves the web TamoGhostText announces the suggestion, accepts it with Tab and dismisses it with Escape, only from
 *          the field.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoGhostText } from "#react/tamo-ghost-text/tamo-ghost-text";

describe("TamoGhostText (web)", () => {
  it("accepts with Tab and dismisses with Escape", () => {
    const onAccept = vi.fn();
    const onDismiss = vi.fn();
    render(
      <TamoGhostText value="Hello" suggestion=" there" onAccept={onAccept} onDismiss={onDismiss}>
        <input aria-label="Note" defaultValue="Hello" />
      </TamoGhostText>,
    );
    expect(screen.getByRole("status").textContent).toContain("there");
    const input = screen.getByRole("textbox", { name: "Note" });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(onAccept).toHaveBeenCalledWith("Hello there");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does nothing without a suggestion", () => {
    const onAccept = vi.fn();
    render(
      <TamoGhostText value="Hello" suggestion="" onAccept={onAccept} onDismiss={vi.fn()}>
        <input aria-label="Note" />
      </TamoGhostText>,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Tab" });
    expect(onAccept).not.toHaveBeenCalled();
  });
});
