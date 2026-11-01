/**
 * Stackra file contract:
 * Purpose: proves the web CommandPalette offers "Ask Tamo" with the typed words when a slot is on, and opens the panel with
 *          them.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { CommandPalette } from "#react/command-palette/command-palette";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("CommandPalette with Tamo (web)", () => {
  it("hands the typed question to the Ask Tamo panel", () => {
    const slot = slotOf(vi.fn());
    const onAction = vi.fn();
    render(
      <TamoContext.Provider value={slot}>
        <CommandPalette sections={[]} onAction={onAction} defaultOpen />
      </TamoContext.Provider>,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "late orders" } });
    fireEvent.click(screen.getByRole("option", { name: "Ask Tamo: late orders" }));
    expect(slot.panel.open).toHaveBeenCalledWith("late orders");
    expect(onAction).not.toHaveBeenCalled();
  });
});
