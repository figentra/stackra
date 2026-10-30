/**
 * Stackra file contract:
 * Purpose: proves the web TabBar is a named navigation landmark of at most five links, the current one marked as the
 *          page, a badge said in the tab's name, and `onPress` run for a tab without an `href`.
 * Boundary: jsdom with React Aria's Link.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TabBar } from "#react/tab-bar/tab-bar";

describe("TabBar (web)", () => {
  it("draws five named tabs with the current page and badges", () => {
    const more = vi.fn();
    render(
      <TabBar
        label="Main"
        position="static"
        items={[
          { id: "t1", label: "Home", href: "/", isCurrent: true },
          { id: "t2", label: "Orders", href: "/orders", badge: 3 },
          { id: "t3", label: "Products", href: "/products" },
          { id: "t4", label: "Customers", href: "/customers" },
          { id: "t5", label: "More", onPress: more },
          { id: "t6", label: "Sixth", href: "/sixth" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.queryByText("Sixth")).toBeNull();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Orders, 3" }).getAttribute("href")).toBe("/orders");
    fireEvent.click(screen.getByRole("link", { name: "More" }));
    expect(more).toHaveBeenCalledOnce();
  });
});
