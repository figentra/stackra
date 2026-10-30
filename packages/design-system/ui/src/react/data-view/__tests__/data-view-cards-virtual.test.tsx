/**
 * Stackra file contract:
 * Purpose: proves the web `DataViewCards` when virtualised: the cards become one named listbox of options named by
 *          their title, Enter on a card opens it, and with `infinite` paging a scroll near the end asks for the next
 *          page, and not when the scroll is far from it.
 * Boundary: the cards over a real `useCollection` in server mode, in jsdom; the element sizes and
 *           `IntersectionObserver` are stand-ins so React Aria's virtualiser has a viewport to fill.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import { DataViewCards } from "#react/data-view/data-view-cards";
import type { DataViewCardsProps } from "#react/data-view/data-view-cards.props";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer" },
  { id: "city", label: "City" },
];
const ROWS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  customer: `Customer ${index + 1}`,
  city: index % 2 ? "Jeddah" : "Riyadh",
}));
type Row = (typeof ROWS)[number];

/** Virtualised cards over a server engine that pages two rows at a time. */
function Harness({
  fetch,
  ...props
}: Partial<Omit<DataViewCardsProps<Row>, "collection" | "label">> & {
  readonly fetch: (query: CollectionQuery) => Promise<{ items: Row[]; totalCount: number }>;
}) {
  const collection = useCollection<Row>({
    columns: COLUMNS,
    mode: "server",
    paging: "infinite",
    fetch,
    initialState: { pageSize: 2 },
  });
  return <DataViewCards collection={collection} label="Customers" isVirtualized {...props} />;
}

/** A fetch that serves pages of two rows. */
const pages = () =>
  vi.fn((query: CollectionQuery) =>
    Promise.resolve({ items: ROWS.slice(query.page * 2, query.page * 2 + 2), totalCount: 6 }),
  );

/** Watches nothing: jsdom has no intersection observer (the loader row asks for one). */
class IntersectionObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe("DataViewCards virtualised (web)", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStandIn);
    for (const key of ["clientWidth", "offsetWidth"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(800);
    for (const key of ["clientHeight", "offsetHeight"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(400);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("draws a named listbox of cards and opens one with Enter", async () => {
    const onItemPress = vi.fn();
    render(<Harness fetch={pages()} onItemPress={onItemPress} />);
    const box = await screen.findByRole("listbox", { name: "Customers" });
    const option = await within(box).findByRole("option", { name: /Customer 2/ });
    expect(within(option).getByText("Jeddah")).toBeTruthy();
    fireEvent.keyDown(option, { key: "Enter" });
    fireEvent.keyUp(option, { key: "Enter" });
    expect(onItemPress).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }));
  });

  it("asks for the next page when scrolled near the end", async () => {
    const fetch = pages();
    render(<Harness fetch={fetch} />);
    const box = await screen.findByRole("listbox", { name: "Customers" });
    await within(box).findByRole("option", { name: /Customer 1/ });
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(600);
    await act(async () => {
      box.scrollTop = 250;
      fireEvent.scroll(box);
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ page: 1 }));
  });

  it("does not load more while scrolled far from the end", async () => {
    const fetch = pages();
    render(<Harness fetch={fetch} />);
    const box = await screen.findByRole("listbox", { name: "Customers" });
    await within(box).findByRole("option", { name: /Customer 1/ });
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(5000);
    await act(async () => {
      fireEvent.scroll(box);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
