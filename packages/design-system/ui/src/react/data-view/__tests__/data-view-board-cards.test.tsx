/**
 * Stackra file contract:
 * Purpose: proves the web `DataViewBoard` beyond its columns: a value outside the field's options gets its own column
 *          after them, an empty column says so, a card shows the named title, subtitle, meta and labelled fields (through
 *          `renderCell` when given), a card's menu offers only the other columns, and Enter on a card opens it.
 * Boundary: the board over a real `useCollection` in client mode, in jsdom. A pointer drop is left to a real browser:
 *           React Aria finds the drop target from the layout, which jsdom does not have.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (Board view); WCAG 2.2 SC 2.1.1 and 2.5.7;
 *          ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataViewBoard as BoardShape } from "#contracts/types/data-view-board.type";
import { DataViewBoard } from "#react/data-view/data-view-board";
import type { DataViewBoardProps } from "#react/data-view/data-view-board.props";
import { useCollection } from "#react/hooks/use-collection";

type Row = { readonly id: string; readonly [key: string]: unknown };

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isRowHeader: true },
  { id: "city", label: "City" },
  { id: "total", label: "Total", type: "number" },
  { id: "channel", label: "Channel" },
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "new", label: "New" },
      { id: "packed", label: "Packed" },
      { id: "done", label: "Done" },
    ],
  },
];
const ROWS: readonly Row[] = [
  { id: "1", customer: "Al Noor", city: "Riyadh", total: 120, channel: "Web", status: "new" },
  { id: "2", customer: "Gulf Dates", city: "Jeddah", total: 80, channel: "Shop", status: "new" },
  { id: "3", customer: "Najd Coffee", city: "Dammam", total: 45, channel: "Web", status: "held" },
];

/** A board over the rows, with the given card slots and extras. */
function Board({
  onMove = vi.fn(),
  card,
  ...props
}: Partial<Omit<DataViewBoardProps<Row>, "board" | "collection">> & {
  readonly onMove?: (item: Row, value: string) => void;
  readonly card?: BoardShape<Row>["card"];
}) {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <DataViewBoard<Row>
      label="Orders"
      collection={collection}
      board={{ field: "status", onMove, ...(card ? { card } : {}) }}
      {...props}
    />
  );
}

describe("DataViewBoard cards (web)", () => {
  it("adds a column for a value outside the options, after them, and says when one is empty", () => {
    render(<Board />);
    const names = screen.getAllByRole("grid").map((grid) => grid.getAttribute("aria-label"));
    expect(names).toEqual(["Orders: New", "Orders: Packed", "Orders: Done", "Orders: held"]);
    const packed = screen.getByRole("region", { name: "Packed" });
    expect(within(packed).getByText("Nothing here yet")).toBeTruthy();
    expect(within(packed).getByText("0 cards")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "held" })).getByText("1 card")).toBeTruthy();
  });

  it("shows the named slots of a card, through renderCell when given", () => {
    render(
      <Board
        card={{ title: "customer", subtitle: "city", meta: "channel", fields: ["total"] }}
        renderCell={(item, column) => `${column.label}=${String(item[column.id])}`}
      />,
    );
    const card = screen.getAllByRole("row")[0];
    if (!card) throw new Error("no card");
    const view = within(card);
    expect(view.getByText("Customer=Al Noor")).toBeTruthy();
    expect(view.getByText("City=Riyadh")).toBeTruthy();
    expect(view.getByText("Channel=Web")).toBeTruthy();
    expect(view.getByText("Total")).toBeTruthy();
    expect(view.getByText("Total=120")).toBeTruthy();
  });

  it("draws plain text and no field list when the card names no fields", () => {
    render(<Board card={{ title: "customer", subtitle: "city", fields: [] }} />);
    const card = screen.getAllByRole("row")[0];
    if (!card) throw new Error("no card");
    expect(within(card).getByText("Riyadh")).toBeTruthy();
    expect(card.querySelector("dl")).toBeNull();
  });

  it("offers only the other columns in a card's menu", async () => {
    render(<Board />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Move Al Noor" }));
    });
    const menu = await screen.findByRole("menu");
    const offered = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    expect(offered).toEqual(["Packed", "Done", "held"]);
  });

  it("opens a card from a press or Enter", () => {
    const onItemPress = vi.fn();
    render(<Board onItemPress={onItemPress} />);
    const card = screen.getAllByRole("row")[1];
    if (!card) throw new Error("no card");
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyUp(card, { key: "Enter" });
    expect(onItemPress).toHaveBeenLastCalledWith(expect.objectContaining({ id: "2" }));
  });
});
