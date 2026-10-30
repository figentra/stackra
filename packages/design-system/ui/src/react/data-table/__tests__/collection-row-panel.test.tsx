/**
 * Stackra file contract:
 * Purpose: proves the web `CollectionRowPanel`: with no row it is closed (inert, no width) and draws nothing of a row; with a row it is a
 *          panel named "{label} details" with the title as a heading and the app's content for that row; the expand
 *          toggle widens it and keeps it open, and the close button asks the app to clear the row.
 * Boundary: the panel over the real SidePanel in jsdom; `useBreakpoint` is a stand-in for a desktop window.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import { CollectionRowPanel } from "#react/data-table/collection-row-panel";

vi.mock("#react/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => ({ breakpoint: "xl", sizeClass: "desktop" }),
}));

const press = (element: HTMLElement) => act(() => element.click());

type Row = { readonly id: string; readonly customer: string };
const ROW: Row = { id: "1", customer: "Al Noor" };

/** The panel beside a table stand-in. */
const renderPanel = (item: Row | null, onClose = vi.fn()) =>
  render(
    <CollectionRowPanel<Row>
      label="Orders"
      item={item}
      title={item?.customer ?? ""}
      renderPanel={(row) => <p>Order of {row.customer}</p>}
      onClose={onClose}
    >
      <table aria-label="Orders table" />
    </CollectionRowPanel>,
  );

describe("CollectionRowPanel (web)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("is closed with no row and draws nothing of one", () => {
    renderPanel(null);
    expect(screen.getByRole("table", { name: "Orders table" })).toBeTruthy();
    const panel = screen.getByRole("complementary", { name: "Orders details", hidden: true });
    expect(panel.hasAttribute("inert")).toBe(true);
    expect(panel.style.width).toBe("0px");
    expect(screen.queryByText(/Order of/)).toBeNull();
  });

  it("shows the opened row under its title in a named panel", () => {
    renderPanel(ROW);
    const panel = screen.getByRole("complementary", { name: "Orders details" });
    expect(panel.hasAttribute("inert")).toBe(false);
    expect(within(panel).getByRole("heading", { level: 3 }).textContent).toBe("Al Noor");
    expect(within(panel).getByText("Order of Al Noor")).toBeTruthy();
  });

  it("expands from the toggle and asks the app to close from the close button", () => {
    const onClose = vi.fn();
    renderPanel(ROW, onClose);
    press(screen.getByRole("button", { name: "Expand panel" }));
    expect(screen.getByRole("button", { name: "Expand panel" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(onClose).not.toHaveBeenCalled();
    press(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
