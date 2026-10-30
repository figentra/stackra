/**
 * Stackra file contract:
 * Purpose: proves the DataView's two editors over a real engine: the sort editor shows the empty note, adds a key,
 *          flips its direction, removes it and reorders keys from the keyboard; the filter editor edits the top rule
 *          group, adds, edits and removes nested groups, and clears every rule.
 * Boundary: the editors over a real `useCollection` in client mode, read back through the engine's state, in jsdom.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import { CollectionFilterEditor } from "#react/data-view/collection-filter-editor";
import { CollectionSortEditor } from "#react/data-view/collection-sort-editor";
import { useCollection } from "#react/hooks/use-collection";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isSortable: true },
  { id: "city", label: "City", isSortable: true },
  { id: "total", label: "Total", type: "number", isSortable: true },
];
const ROWS = [{ id: "1", customer: "Najd", city: "Riyadh", total: 5 }];

/** Both editors on one engine, with a readout of its sort and filter. */
function Harness({ initialState }: { readonly initialState?: Partial<CollectionState> }) {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    initialState: initialState ?? {},
  });
  return (
    <>
      <CollectionSortEditor collection={collection} label="Orders" />
      <CollectionFilterEditor collection={collection} label="Orders" />
      <output data-testid="sort">
        {collection.state.sort.map((key) => `${key.column}:${key.direction}`).join(",")}
      </output>
      <output data-testid="filter">{JSON.stringify(collection.state.filter)}</output>
    </>
  );
}

const sortText = () => screen.getByTestId("sort").textContent;
const filter = () =>
  JSON.parse(screen.getByTestId("filter").textContent ?? "{}") as CollectionState["filter"];

describe("CollectionSortEditor (web)", () => {
  it("adds a key, flips its direction and removes it", () => {
    render(<Harness />);
    expect(screen.getByText(/Not sorted/)).toBeTruthy();
    press(screen.getByRole("button", { name: /Add a sort key/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: "City" }));
    expect(sortText()).toBe("city:ascending");
    press(screen.getByRole("button", { name: "Direction of City: ascending" }));
    expect(sortText()).toBe("city:descending");
    press(screen.getByRole("button", { name: "Direction of City: descending" }));
    expect(sortText()).toBe("city:ascending");
    press(screen.getByRole("button", { name: "Remove City from the sort" }));
    expect(sortText()).toBe("");
  });

  it("hides the add picker once every sortable column is a key, and reorders keys from the keyboard", () => {
    vi.useFakeTimers();
    try {
      render(
        <Harness
          initialState={{
            sort: [
              { column: "customer", direction: "ascending" },
              { column: "city", direction: "descending" },
              { column: "total", direction: "ascending" },
            ],
          }}
        />,
      );
      expect(screen.queryByRole("button", { name: /Add a sort key/ })).toBeNull();
      expect(
        within(screen.getByRole("grid", { name: "Sort Orders" })).getAllByRole("row"),
      ).toHaveLength(3);
      const handle = screen.getByRole("button", { name: "Reorder Customer" });
      act(() => handle.focus());
      fireEvent.keyDown(handle, { key: "Enter" });
      fireEvent.keyUp(handle, { key: "Enter" });
      act(() => vi.runAllTimers());
      for (const key of ["ArrowDown", "ArrowDown", "Enter"]) {
        fireEvent.keyDown(document.activeElement ?? document.body, { key });
        fireEvent.keyUp(document.activeElement ?? document.body, { key });
      }
      act(() => vi.runAllTimers());
      expect(sortText()).toBe("city:descending,total:ascending,customer:ascending");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("CollectionFilterEditor (web)", () => {
  it("edits the top group, adds, edits and removes a nested group, then clears everything", () => {
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
    press(screen.getAllByRole("button", { name: "Add a condition" })[0] as HTMLElement);
    expect(filter().conditions).toHaveLength(1);
    expect(filter().groups).toEqual([]);

    press(screen.getByRole("button", { name: "Add a group" }));
    expect(filter().groups).toHaveLength(1);
    expect(filter().groups?.[0]?.match).toBe("any");
    const group = screen.getByRole("region", { name: "Group 1" });
    press(within(group).getByRole("button", { name: "Add a condition" }));
    expect(filter().groups?.[0]?.conditions).toHaveLength(1);
    // The top rule still edits with the group kept.
    press(screen.getAllByRole("button", { name: "Add a condition" })[0] as HTMLElement);
    expect(filter().conditions).toHaveLength(2);
    expect(filter().groups).toHaveLength(1);

    press(within(group).getByRole("button", { name: "Remove the group" }));
    expect(filter().groups).toEqual([]);
    press(screen.getByRole("button", { name: "Clear filters" }));
    expect(filter()).toEqual({ match: "all", conditions: [] });
  });
});
