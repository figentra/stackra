/**
 * Stackra file contract:
 * Purpose: proves the web DataGrid names the grid from `label`, renders HeroUI Pro's columns and rows, passes its
 *          other props through, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `ResizeObserver` is stubbed because jsdom has none; the theme
 *          CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-003
import { render, screen } from "@testing-library/react";

import { DataGrid, type DataGridColumn, type DataGridProps } from "#react/data-grid/data-grid";

interface Person {
  readonly id: number;
  readonly name: string;
}

const columns: DataGridColumn<Person>[] = [
  { id: "name", header: "Name", accessorKey: "name", isRowHeader: true },
];
const data: Person[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
];

describe("DataGrid (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("takes its accessible name from label and renders HeroUI Pro's columns and rows", () => {
    render(<DataGrid label="People" data={data} columns={columns} getRowId={(item) => item.id} />);
    const grid = screen.getByRole("grid", { name: "People" });
    expect(grid.getAttribute("aria-label")).toBe("People");
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("rowheader", { name: "Grace" })).toBeTruthy();
  });

  it("passes HeroUI Pro's own props through", () => {
    const { container } = render(
      <DataGrid
        label="People"
        data={data}
        columns={columns}
        getRowId={(item) => item.id}
        className="extra"
        selectionMode="multiple"
        showSelectionCheckboxes
      />,
    );
    expect(container.querySelector(".extra")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Select all" })).toBeTruthy();
  });

  it("renders the empty state when there is no data", () => {
    render(
      <DataGrid
        label="People"
        data={[]}
        columns={columns}
        getRowId={(item: Person) => item.id}
        renderEmptyState={() => <i>none</i>}
      />,
    );
    expect(screen.getByText("none")).toBeTruthy();
  });

  it("types the accessible name as label", () => {
    expectTypeOf<DataGridProps<Person>>().toHaveProperty("label");
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<DataGrid aria-label="x" data={[]} columns={[]} getRowId={() => 1} />);
  });
});
