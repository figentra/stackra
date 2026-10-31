/**
 * Stackra file contract:
 * Purpose: proves the home's categories follow the width: below `sm`, one shelf per category with built entries (its
 *          heading, count, a "View all" link that keeps the search params, and its built components as cards); from
 *          `sm`, one group card per such category.
 * Boundary: a memory router in jsdom; the width is the window's (`useBreakpoint`), set before each render.
 * Runtime: browser
 * Governing contract: STA-1371 (listing by width, 2026-10-28); ADR 0022 (test placement).
 */
import "#src/__tests__/stub-browser-apis";

import { byCategory, CATEGORIES } from "@stackra/showcase";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { CategoryOverview } from "#src/components/category-overview";

// The shelves and cards are the subject, not the live previews: each thumbnail lazy-loads its demo, which took the phone
// test past 110 s on a shared runner and left imports the after-each hook could not settle in time.
vi.mock("#src/components/component-thumbnail", () => ({ ComponentThumbnail: () => null }));

/** The categories with a built entry, each with its built entries. */
const FILLED = CATEGORIES.map(({ id }) =>
  byCategory(id).filter((entry) => entry.status !== "planned"),
).filter((built) => built.length > 0);

function renderAt(width: number) {
  window.innerWidth = width;
  const router = createMemoryRouter([{ path: "/", element: <CategoryOverview /> }], {
    initialEntries: ["/?locale=ar"],
  });
  render(<RouterProvider router={router} />);
}

describe("CategoryOverview", () => {
  afterEach(() => {
    window.innerWidth = 1024;
  });

  // Renders every built card: about 6 s on a ci-box, 33 s on a shared GitHub runner, so the budget is 120 s.
  it("is one shelf per filled category on a phone, each with View all and its built cards", () => {
    renderAt(390);
    const viewAll = screen.getAllByRole("link", { name: /^(View all|عرض الكل)$/ });
    expect(viewAll).toHaveLength(FILLED.length);
    expect(viewAll[0]?.getAttribute("href")).toBe("/components/foundations?locale=ar");
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(FILLED.length);
    expect(screen.getAllByRole("listitem")).toHaveLength(
      FILLED.reduce((sum, built) => sum + built.length, 0),
    );
  }, 120_000);

  it("is one group card per filled category from sm", () => {
    renderAt(1024);
    expect(screen.queryByRole("link", { name: /^(View all|عرض الكل)$/ })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(FILLED.length);
  });
});
