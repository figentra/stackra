/**
 * Stackra file contract:
 * Purpose: proves the web List with `isVirtualized`: its rows are one named list box,
 *          Enter on a row runs that row's `onPress`, a selecting list reports the ids, a scroll near the end asks for
 *          the next page only while `hasMore` and not loading, the loading row names one spinner, and with no rows it
 *          falls back to the empty state.
 * Boundary: jsdom with real HeroUI and React Aria; element sizes and `IntersectionObserver` are stand-ins so the
 *           virtualiser has a viewport to fill. The icons need no registry: the rows carry none.
 * Runtime: browser
 * Governing contract: ADR 0313; WCAG 2.2 SC 4.1.2 and 4.1.3; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { ListItemData } from "#contracts/types/list-item-data.type";
import { List } from "#react/list/list";

/** Watches nothing: the loading row asks for an observer jsdom does not have. */
class IntersectionObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

const many = (onPress?: (id: string) => void): readonly ListItemData[] =>
  Array.from({ length: 40 }, (_, index) => ({
    id: `o${index}`,
    title: `Order ${index}`,
    ...(onPress ? { onPress: () => onPress(`o${index}`) } : {}),
  }));

/** Scrolls the list box to a place and fires the scroll. */
function scrollTo(box: HTMLElement, top: number, height: number) {
  vi.spyOn(box, "scrollHeight", "get").mockReturnValue(height);
  vi.spyOn(box, "scrollTop", "get").mockReturnValue(top);
  fireEvent.scroll(box);
}

describe("List virtualised (web)", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStandIn);
    for (const key of ["clientWidth", "offsetWidth"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(400);
    for (const key of ["clientHeight", "offsetHeight"] as const)
      vi.spyOn(HTMLElement.prototype, key, "get").mockReturnValue(400);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("draws the rows in one named list box and runs a row's onPress on Enter", () => {
    const pressed = vi.fn();
    render(<List label="Orders" items={many(pressed)} isVirtualized />);
    const box = screen.getByRole("listbox", { name: "Orders" });
    const first = within(box).getByRole("option", { name: "Order 0" });
    fireEvent.keyDown(first, { key: "Enter" });
    fireEvent.keyUp(first, { key: "Enter" });
    expect(pressed).toHaveBeenCalledWith("o0");
  });

  it("reports the selected ids", () => {
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Orders"
        items={many()}
        isVirtualized
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    const row = screen.getByRole("option", { name: "Order 1" });
    fireEvent.keyDown(row, { key: " " });
    fireEvent.keyUp(row, { key: " " });
    expect(onSelectionChange).toHaveBeenLastCalledWith(["o1"]);
  });

  it("asks for the next page near the end, only while there is more and nothing loads", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <List label="Orders" items={many()} isVirtualized hasMore onLoadMore={onLoadMore} />,
    );
    const box = screen.getByRole("listbox", { name: "Orders" });
    scrollTo(box, 0, 2000);
    expect(onLoadMore).not.toHaveBeenCalled();
    scrollTo(box, 1700, 2000);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(
      <List
        label="Orders"
        items={many()}
        isVirtualized
        hasMore
        isLoading
        loadingLabel="Loading orders"
        onLoadMore={onLoadMore}
      />,
    );
    expect(
      screen.getByRole("listbox").parentElement?.closest("[aria-busy]")?.getAttribute("aria-busy"),
    ).toBe("true");
    scrollTo(screen.getByRole("listbox"), 1700, 2000);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("names the spinner of the loading row once", () => {
    render(
      <List
        label="Orders"
        items={many().slice(0, 3)}
        isVirtualized
        hasMore
        isLoading
        loadingLabel="Loading orders"
      />,
    );
    expect(screen.getAllByRole("status", { name: "Loading orders" })).toHaveLength(1);
  });

  it("shows the empty state when there are no rows", () => {
    render(<List label="Orders" items={[]} isVirtualized emptyState={<p>No orders yet</p>} />);
    expect(screen.getByText("No orders yet")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
