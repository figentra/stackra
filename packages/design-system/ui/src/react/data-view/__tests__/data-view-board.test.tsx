/**
 * Stackra file contract:
 * Purpose: proves the web `DataViewBoard`: one named column per choice of the field (in the options' order, with its
 *          count), each a grid list of cards with a named drag handle, and a card's "Move to" menu that asks the app to
 *          move it to another column and says so politely.
 * Boundary: the board over a real `useCollection` in client mode, in jsdom (drag and drop itself is React Aria's).
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (Board view); ADR 0022 (test placement);
 *          STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import { DataViewBoard } from "#react/data-view/data-view-board";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer", isRowHeader: true },
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "new", label: "New" },
      { id: "done", label: "Done" },
    ],
  },
];
const ROWS = [
  { id: "1", customer: "Al Noor", status: "new" },
  { id: "2", customer: "Gulf Dates", status: "new" },
  { id: "3", customer: "Najd Coffee", status: "done" },
];

function Board({ onMove }: { readonly onMove: (id: string, value: string) => void }) {
  const collection = useCollection({ columns: COLUMNS, items: ROWS });
  return (
    <DataViewBoard
      label="Orders"
      collection={collection}
      board={{ field: "status", onMove: (item, value) => onMove(item.id, value) }}
    />
  );
}

describe("DataViewBoard (web)", () => {
  it("draws a named column per choice, with its count and its cards", () => {
    render(<Board onMove={vi.fn()} />);
    const fresh = screen.getByRole("grid", { name: "Orders: New" });
    expect(within(fresh).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("grid", { name: "Orders: Done" })).toBeTruthy();
    expect(screen.getByText("2 cards")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drag Gulf Dates" })).toBeTruthy();
  });

  it("moves a card from its menu to another column and says so", async () => {
    const onMove = vi.fn();
    render(<Board onMove={onMove} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Move Najd Coffee" }));
    });
    const item = await screen.findByRole("menuitem", { name: "New" });
    await act(async () => {
      fireEvent.click(item);
    });
    expect(onMove).toHaveBeenCalledWith("3", "new");
    expect(screen.getByRole("status").textContent).toBe("Najd Coffee moved to New");
  });
});
