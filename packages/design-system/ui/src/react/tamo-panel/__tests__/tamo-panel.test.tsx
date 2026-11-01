/**
 * Stackra file contract:
 * Purpose: proves the web TamoPanel names the screen, asks a handed-over question once, and marks the answer as Tamo's.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { TamoPanel } from "#react/tamo-panel/tamo-panel";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("TamoPanel (web)", () => {
  it("asks the question it was opened with and shows the answer marked", async () => {
    const run = vi.fn(async (..._args: unknown[]) => "Three orders wait for you.");
    render(
      <TamoContext.Provider
        value={slotOf(run as unknown as TamoSlot["run"], {
          screenLabel: "Orders",
          panel: { isOpen: true, question: "What waits?", open: vi.fn(), close: vi.fn() },
        })}
      >
        <TamoPanel />
      </TamoContext.Provider>,
    );
    expect(screen.getByText("On this screen: Orders")).toBeTruthy();
    await screen.findByText("Three orders wait for you.");
    expect(run).toHaveBeenCalledOnce();
    expect(run.mock.calls[0]?.[0]).toBe("ask");
    expect(screen.getByText("Made with Tamo")).toBeTruthy();
  });
});
