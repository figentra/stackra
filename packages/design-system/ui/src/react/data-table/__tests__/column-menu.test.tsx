/**
 * Stackra file contract:
 * Purpose: proves the web `ColumnMenu` over a real engine: sorts ascending and descending, adds to and clears from
 *          the sort, filters, groups and ungroups, sets and clears a number column's summary, pins to start, end and
 *          back, moves towards either end with an announcement, starts a resize after the menu closes, and hides.
 * Boundary: the menu over a real `useCollection`, read back through a readout of the engine's state, in jsdom.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { ColumnMenu } from "#react/data-table/column-menu";
import { useCollection } from "#react/hooks/use-collection";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [
  { id: "name", label: "Name", isSortable: true },
  { id: "city", label: "City", isSortable: true, isGroupable: true },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = [{ id: "1", name: "Latte", city: "Riyadh", total: 4 }];

/** One column's menu on an engine, with a readout and the announcer region. */
function Harness({
  columnId,
  onStartResize,
  onFilterColumn,
}: {
  readonly columnId: string;
  readonly onStartResize?: () => void;
  readonly onFilterColumn?: (id: string) => void;
}) {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  const column = collection.columns.find((entry) => entry.id === columnId);
  return (
    <>
      {column ? (
        <ColumnMenu
          column={column}
          collection={collection}
          onStartResize={onStartResize}
          onFilterColumn={onFilterColumn}
        />
      ) : null}
      <output data-testid="state">
        {[
          collection.state.sort.map((key) => `${key.column}:${key.direction}`).join("+"),
          collection.state.groupBy ?? "-",
          JSON.stringify(collection.state.aggregates),
          collection.columns
            .map(
              (entry) =>
                `${entry.id}${entry.pin ? `-${entry.pin}` : ""}${entry.isHidden ? "-hidden" : ""}`,
            )
            .join(","),
        ].join("|")}
      </output>
      <div data-collection-announcer data-testid="say" />
    </>
  );
}

const readout = () => screen.getByTestId("state").textContent;
const choose = (column: string, item: string) => {
  press(screen.getByRole("button", { name: `${column} options` }));
  press(screen.getByRole("menuitem", { name: item }));
};

describe("ColumnMenu (web)", () => {
  it("sorts, adds to and clears from the sort, filters, groups and ungroups", () => {
    const onFilterColumn = vi.fn();
    render(<Harness columnId="city" onFilterColumn={onFilterColumn} />);
    choose("City", "Sort descending");
    expect(readout()).toMatch(/^city:descending\|/);
    choose("City", "Sort ascending");
    expect(readout()).toMatch(/^city:ascending\|/);
    choose("City", "Remove from sort");
    expect(readout()).toMatch(/^\|/);
    choose("City", "Add to sort");
    expect(readout()).toMatch(/^city:ascending\|/);
    choose("City", "Filter by this column");
    expect(onFilterColumn).toHaveBeenCalledWith("city");
    choose("City", "Group by this column");
    expect(readout()).toContain("|city|");
    choose("City", "Stop grouping");
    expect(readout()).toContain("|-|");
  });

  it("pins, unpins, moves with an announcement, and hides", () => {
    render(<Harness columnId="city" />);
    choose("City", "Pin to start");
    expect(readout()).toMatch(/\|city-start,name,total$/);
    choose("City", "Pin to end");
    expect(readout()).toMatch(/\|name,total,city-end$/);
    choose("City", "Unpin");
    expect(readout()).toMatch(/\|name,city,total$/);
    choose("City", "Move towards start");
    expect(readout()).toMatch(/\|city,name,total$/);
    expect(screen.getByTestId("say").textContent).toBe("City moved to position 1 of 3");
    choose("City", "Move towards end");
    expect(readout()).toMatch(/\|name,city,total$/);
    choose("City", "Hide column");
    expect(readout()).toMatch(/city-hidden/);
  });

  it("sets and clears a number column's summary, and offers no sort or move-end there", async () => {
    render(<Harness columnId="total" />);
    press(screen.getByRole("button", { name: "Total options" }));
    expect(screen.queryByRole("menuitem", { name: "Sort ascending" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Move towards end" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Summary" }), { key: "ArrowRight" });
    press(await screen.findByRole("menuitem", { name: "Sum" }));
    expect(readout()).toContain('"total":"sum"');
    press(screen.getByRole("button", { name: "Total options" }));
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Summary" }), { key: "ArrowRight" });
    press(await screen.findByRole("menuitem", { name: "No summary" }));
    expect(readout()).toContain("|{}|");
  });

  it("starts a resize only after the menu has closed", () => {
    vi.useFakeTimers();
    try {
      const onStartResize = vi.fn();
      render(<Harness columnId="total" onStartResize={onStartResize} />);
      choose("Total", "Resize column");
      expect(onStartResize).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(300));
      expect(onStartResize).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
