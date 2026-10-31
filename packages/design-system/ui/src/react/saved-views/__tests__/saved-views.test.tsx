/**
 * Stackra file contract:
 * Purpose: proves the web SavedViews over a real engine. The `menu` variant: the picker labels the default and
 *          shared views, applies one and goes back to all records; the action menu saves, renames (prefilled), shares,
 *          makes and unmakes the default and deletes the active view; the naming form refuses a blank name and
 *          cancels. The `tabs` and `chips` variants show the applied view as chosen and apply another.
 * Boundary: jsdom with real HeroUI and React Aria; the menu's engine is a real `useCollection`, read back through a
 *           readout.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0505 (one saved-view model); ADR 0022 (test
 *          placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionView } from "#contracts/types/collection-view.type";
import { useCollection } from "#react/hooks/use-collection";
import { SavedViews } from "#react/saved-views/saved-views";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [{ id: "name", label: "Name", isSortable: true }];
const ROWS = [{ id: "1", name: "Latte" }];
const VIEWS: readonly CollectionView[] = [
  { id: "big", label: "Big", state: { search: "lat" } },
  { id: "team", label: "Team", state: {}, isShared: true },
];

/** The menu on an engine with two saved views, and a readout of the engine. */
function Harness({
  onShareView,
  variant,
}: {
  readonly onShareView?: (view: CollectionView) => void;
  readonly variant?: "menu" | "tabs" | "chips";
}) {
  const collection = useCollection({
    columns: COLUMNS,
    items: ROWS,
    views: VIEWS,
    defaultViewId: "big",
  });
  return (
    <>
      <SavedViews collection={collection} onShareView={onShareView} variant={variant} />
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

describe("SavedViews menu (web)", () => {
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

describe("SavedViews tabs and chips (web)", () => {
  beforeEach(() => {
    // HeroUI's tab indicator measures its tab; jsdom has no ResizeObserver.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    // jsdom has no Web Animations; the tab panel waits on them.
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: () => [],
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "getAnimations");
  });

  it("draws a tab per view, the applied one chosen, and applies another", () => {
    render(<Harness variant="tabs" />);
    expect(screen.getByRole("tab", { name: "Big (default)" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    press(screen.getByRole("tab", { name: "Team (shared)" }));
    expect(readout()).toBe("team|big|Big,Team|");
    press(screen.getByRole("tab", { name: "All records" }));
    expect(readout()).toBe("-|big|Big,Team|");
  });

  it("draws a chip per view and applies the one picked", () => {
    render(<Harness variant="chips" />);
    fireEvent.click(screen.getByText("Team (shared)"));
    expect(readout()).toBe("team|big|Big,Team|");
  });
});
