/**
 * Stackra file contract:
 * Purpose: proves the web FilterBar's Ask Tamo sends the filterable columns, draws the proposal as chips, and Apply puts the
 *          conditions and sort on the engine.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TamoSlot } from "#contracts/types/tamo-slot.type";
import { TamoContext } from "#react/hooks/tamo-context";
import { FilterBar } from "#react/filter-bar/filter-bar";
import { useCollection } from "#react/hooks/use-collection";

/** A slot that answers every task with `answer` (or never, with `pending`). */
function slotOf(run: TamoSlot["run"], overrides: Partial<TamoSlot> = {}): TamoSlot {
  return {
    isEnabled: () => true,
    run,
    panel: { isOpen: false, question: undefined, open: vi.fn(), close: vi.fn() },
    ...overrides,
  };
}

interface Order {
  readonly id: string;
  readonly status: string;
  readonly total: number;
}

/** A bar over an engine, with the engine shown. */
function Bar({ slot }: { readonly slot: TamoSlot }) {
  const collection = useCollection<Order>({
    items: [{ id: "1", status: "paid", total: 700 }],
    columns: [
      { id: "status", label: "Status", type: "choice", options: [{ id: "paid", label: "Paid" }] },
      { id: "total", label: "Total", type: "number" },
    ],
  });
  return (
    <TamoContext.Provider value={slot}>
      <FilterBar collection={collection} searchLabel="Search orders" />
      <output data-testid="state">
        {JSON.stringify({
          filter: collection.state.filter.conditions,
          sort: collection.state.sort,
        })}
      </output>
    </TamoContext.Provider>
  );
}

describe("FilterBar with Tamo (web)", () => {
  it("applies Tamo's proposed chips", async () => {
    const run = vi.fn(async (..._args: unknown[]) => ({
      conditions: [{ id: "filter:status", field: "status", operator: "in", value: ["paid"] }],
      sort: [{ column: "total", direction: "descending" }],
    }));
    render(<Bar slot={slotOf(run as unknown as TamoSlot["run"])} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask Tamo" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Filter and sort in words" }), {
      target: { value: "paid, biggest first" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filter and sort in words" }));
    expect(run.mock.calls[0]?.[1]).toMatchObject({ columns: [{ id: "status" }, { id: "total" }] });
    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));
    const shown = JSON.parse(screen.getByTestId("state").textContent ?? "{}") as {
      filter: unknown[];
      sort: unknown[];
    };
    expect(shown.filter).toHaveLength(1);
    expect(shown.sort).toEqual([{ column: "total", direction: "descending" }]);
  });
});
