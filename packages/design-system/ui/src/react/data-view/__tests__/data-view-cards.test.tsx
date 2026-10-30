/**
 * Stackra file contract:
 * Purpose: proves the web `DataViewCards`: cards show the title, meta, subtitle, media and the remaining fields as a
 *          description list, drawn through `renderCell` when given; a pressable title or list row reports its item;
 *          grouped rows render one named section per group, as cards or as a list.
 * Boundary: the cards over a real `useCollection` in client mode, in jsdom.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataViewCardsProps } from "#react/data-view/data-view-cards.props";
import { DataViewCards } from "#react/data-view/data-view-cards";
import { useCollection } from "#react/hooks/use-collection";

const press = (element: HTMLElement) => act(() => element.click());

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer" },
  { id: "city", label: "City" },
  { id: "total", label: "Total", type: "number" },
  { id: "status", label: "Status" },
];
const ROWS = [
  { id: "1", customer: "Al Noor", city: "Riyadh", total: 1200, status: "Paid" },
  { id: "2", customer: "Najd Coffee", city: "Jeddah", total: 300, status: "Due" },
];

type Row = (typeof ROWS)[number];

/** The cards on an engine, optionally grouped by city. */
function Harness({
  groupBy,
  ...props
}: Omit<DataViewCardsProps<Row>, "collection" | "label"> & { readonly groupBy?: string }) {
  const collection = useCollection<Row>({
    columns: COLUMNS,
    items: ROWS,
    initialState: groupBy ? { groupBy } : {},
  });
  return <DataViewCards collection={collection} label="Customers" {...props} />;
}

describe("DataViewCards (web)", () => {
  it("draws a card's title, meta, subtitle, media and fields, through renderCell", () => {
    render(
      <Harness
        fields={{
          title: "customer",
          subtitle: "city",
          meta: "status",
          fields: ["total", "missing"],
          media: (item) => <img alt={`Logo of ${item.customer}`} />,
        }}
        renderCell={(item, column) => `${column.id}:${String(item[column.id as keyof Row])}`}
      />,
    );
    const cards = screen.getByRole("list", { name: "Customers" });
    const first = within(cards).getAllByRole("listitem")[0] as HTMLElement;
    expect(within(first).getByRole("heading").textContent).toBe("customer:Al Noor");
    expect(within(first).getByText("status:Paid")).toBeTruthy();
    expect(within(first).getByText("city:Riyadh")).toBeTruthy();
    expect(within(first).getByRole("img", { name: "Logo of Al Noor" })).toBeTruthy();
    expect(within(first).getByText("Total")).toBeTruthy();
    expect(within(first).getByText("total:1200")).toBeTruthy();
  });

  it("reports a pressed card title, and leaves the field list out when none are left", () => {
    const onItemPress = vi.fn();
    render(<Harness fields={{ fields: [] }} onItemPress={onItemPress} />);
    press(screen.getByRole("button", { name: "Najd Coffee" }));
    expect(onItemPress).toHaveBeenCalledWith(ROWS[1]);
    expect(document.querySelector("dl")).toBeNull();
  });

  it("renders one named section per group, as cards and as a list with pressable rows", () => {
    const onItemPress = vi.fn();
    const { unmount } = render(<Harness groupBy="city" />);
    expect(
      screen.getAllByRole("region").map((section) => section.getAttribute("aria-label")),
    ).toEqual([expect.stringMatching(/^Riyadh · /), expect.stringMatching(/^Jeddah · /)]);
    unmount();
    render(
      <Harness
        groupBy="city"
        layout="list"
        fields={{ meta: "status", media: (item) => <img alt={item.customer} /> }}
        onItemPress={onItemPress}
      />,
    );
    const riyadh = screen.getAllByRole("region")[0] as HTMLElement;
    expect(within(riyadh).getByText("Al Noor")).toBeTruthy();
    expect(within(riyadh).getByText("Paid")).toBeTruthy();
    press(within(riyadh).getByText("Al Noor"));
    expect(onItemPress).toHaveBeenCalledWith(ROWS[0]);
  });
});
