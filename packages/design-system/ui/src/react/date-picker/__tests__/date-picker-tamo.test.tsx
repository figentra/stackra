/**
 * Stackra file contract:
 * Purpose: proves the web DatePicker's popover asks Tamo for a day in words and Apply picks it.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { parseDate } from "@internationalized/date";
import { fireEvent, render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { DatePicker } from "#react/date-picker/date-picker";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

describe("DatePicker with Tamo (web)", () => {
  it("picks the day Tamo proposes", async () => {
    const run = vi.fn(async (..._args: unknown[]) => ({ start: "2026-11-06" }));
    const onChange = vi.fn();
    render(
      <TamoContext.Provider value={slotOf(run as unknown as TamoSlot["run"])}>
        <DatePicker label="Due" defaultOpen onChange={onChange} today={parseDate("2026-10-31")} />
      </TamoContext.Provider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Tamo" }), {
      target: { value: "next Friday" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));
    expect(run.mock.calls[0]?.[1]).toMatchObject({ today: "2026-10-31", isRange: false });
    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith(parseDate("2026-11-06"));
  });
});
