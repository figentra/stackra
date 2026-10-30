/**
 * Stackra file contract:
 * Purpose: proves the web saved views. `SavedViewsMenu` over a real engine: the picker labels the default and shared
 *          views, applies one and goes back to all records; the action menu saves, renames (prefilled), shares, makes
 *          and unmakes the default and deletes the active view; the naming form refuses a blank name and cancels.
 *          `SavedViews`: an active view hides the save button, facets without a count read plainly, and a picked
 *          facet stays picked.
 * Boundary: jsdom with real HeroUI and React Aria; the menu's engine is a real `useCollection`, read back through a
 *           readout.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionView } from "#contracts/types/collection-view.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { useCollection } from "#react/hooks/use-collection";
import { SavedViews } from "#react/saved-views/saved-views";
import { SavedViewsMenu } from "#react/saved-views/saved-views-menu";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [{ id: "name", label: "Name", isSortable: true }];
const ROWS = [{ id: "1", name: "Latte" }];
const VIEWS: readonly CollectionView[] = [
  { id: "big", label: "Big", state: { search: "lat" } },
  { id: "team", label: "Team", state: {}, isShared: true },
];

/** The menu on an engine with two saved views, and a readout of the engine. */
function Harness({ onShareView }: { readonly onShareView?: (view: CollectionView) => void }) {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    views: VIEWS,
    defaultViewId: "big",
  });
  return (
    <>
      <SavedViewsMenu collection={collection} onShareView={onShareView} />
      <output data-testid="state">
        {`${collection.state.viewId ?? "-"}|${collection.defaultViewId ?? "-"}|${collection.views.map((view) => view.label).join(",")}|${collection.state.search}`}
      </output>
    </>
  );
}

const readout = () => screen.getByTestId("state").textContent;
const action = (name: string) => {
  press(screen.getByRole("button", { name: "View actions" }));
  press(screen.getByRole("menuitem", { name }));
};

describe("SavedViewsMenu (web)", () => {
  it("labels the default and shared views, applies one and goes back to all records", () => {
    render(<Harness />);
    expect(readout()).toBe("big|big|Big,Team|lat");
    press(screen.getByRole("button", { name: /Views/ }));
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("All records"),
        expect.stringContaining("Big (default)"),
        expect.stringContaining("Team (shared)"),
      ]),
    );
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /Team/ }));
    expect(readout()).toBe("team|big|Big,Team|");
    press(screen.getByRole("button", { name: /Views/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /All records/ }));
    expect(readout()).toBe("-|big|Big,Team|");
  });

  it("saves, shares, renames, toggles the default and deletes the active view", () => {
    const onShareView = vi.fn();
    render(<Harness onShareView={onShareView} />);
    action("Save changes to view");
    action("Share view");
    expect(onShareView).toHaveBeenCalledWith(expect.objectContaining({ id: "big" }));
    action("Stop using as default");
    expect(readout()).toBe("big|-|Big,Team|lat");
    action("Make default");
    expect(readout()).toBe("big|big|Big,Team|lat");

    action("Rename view");
    const name = screen.getByRole("textbox", { name: "View name" }) as HTMLInputElement;
    expect(name.value).toBe("Big");
    fireEvent.change(name, { target: { value: "Largest" } });
    fireEvent.submit(screen.getByRole("form", { name: "View name" }));
    expect(readout()).toBe("big|big|Largest,Team|lat");

    action("Delete view");
    expect(readout()).toBe("-|-|Team|lat");
  });

  it("offers only save-as without an active view, refuses a blank name and cancels", () => {
    render(<Harness />);
    press(screen.getByRole("button", { name: /Views/ }));
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /All records/ }));
    press(screen.getByRole("button", { name: "View actions" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Save as a new view",
    ]);
    press(screen.getByRole("menuitem", { name: "Save as a new view" }));
    fireEvent.change(screen.getByRole("textbox", { name: "View name" }), {
      target: { value: "   " },
    });
    fireEvent.submit(screen.getByRole("form", { name: "View name" }));
    expect(screen.getByRole("form", { name: "View name" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form", { name: "View name" })).toBeNull();
    expect(readout()).toBe("-|big|Big,Team|");
  });
});

describe("SavedViews (web)", () => {
  const QUERY: ResourceQuery = { search: "", filterValues: { status: ["paid"] }, sort: null };

  it("hides the save button on an active view and keeps a picked facet picked", () => {
    const onQueryChange = vi.fn();
    render(
      <SavedViews
        label="Views"
        views={[{ id: "paid", label: "Paid only", query: QUERY }]}
        query={QUERY}
        onQueryChange={onQueryChange}
        facetFilterId="status"
        facetLabel="Status"
        facets={[
          { id: "paid", label: "Paid" },
          { id: "due", label: "Due" },
        ]}
        onSaveView={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /save view/i })).toBeNull();
    expect(screen.getByText("Paid")).toBeTruthy();
    fireEvent.click(screen.getByText("Due"));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      ...QUERY,
      filterValues: { status: ["paid", "due"] },
    });
  });

  it("draws no facet row without facets", () => {
    render(
      <SavedViews
        label="Views"
        views={[]}
        query={{ search: "", filterValues: { status: "x" }, sort: null }}
        onQueryChange={vi.fn()}
        facetFilterId="status"
        facetLabel="Status"
        facets={[]}
      />,
    );
    expect(screen.queryByText("Status")).toBeNull();
  });
});
