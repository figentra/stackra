/**
 * Stackra file contract:
 * Purpose: proves the web TamoLauncher draws nothing without a slot, and with one opens the panel and announces its shortcut,
 *          and Mod+J opens the panel through the shortcut registry.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0508; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { TamoLauncher } from "#react/tamo-launcher/tamo-launcher";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("TamoLauncher (web)", () => {
  it("draws nothing without the AI module", () => {
    const { container } = render(<TamoLauncher />);
    expect(container.textContent).toBe("");
  });

  it("opens the panel and announces the shortcut", () => {
    const slot = slotOf(vi.fn());
    render(
      <TamoContext.Provider value={slot}>
        <TamoLauncher />
      </TamoContext.Provider>,
    );
    const button = screen.getByRole("button", { name: "Ask Tamo" });
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Meta+J");
    fireEvent.click(button);
    expect(slot.panel.open).toHaveBeenCalledOnce();
  });

  it("opens the panel on Mod+J through the shortcut registry", () => {
    const slot = slotOf(vi.fn());
    render(
      <ShortcutProvider>
        <TamoContext.Provider value={slot}>
          <TamoLauncher />
        </TamoContext.Provider>
      </ShortcutProvider>,
    );
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, code: "KeyJ", key: "j", ctrlKey: true }),
      );
    });
    expect(slot.panel.open).toHaveBeenCalledOnce();
  });
});
