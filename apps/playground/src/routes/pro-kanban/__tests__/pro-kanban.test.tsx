/**
 * Stackra file contract:
 * Purpose: proves the Kanban page sits at /pro-kanban in the Pro group, titles the page and the document, draws three
 *          named columns with their cards and counts, moves a card to the next column from its button, and reports it.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither. Dragging is HeroUI Pro's and is checked by the e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { fireEvent, render, screen, within } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProKanban } from "#src/routes/pro-kanban/pro-kanban";
import { ProKanbanRoute } from "#src/routes/pro-kanban/pro-kanban.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

/** The titles of the cards in a column. */
const cards = (column: string) =>
  within(screen.getByRole("grid", { name: `${column} cards` }))
    .queryAllByRole("row")
    .map((row) => row.textContent);

describe("ProKanban", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-kanban in the Pro group, and titles the page and the document", () => {
    render(<ProKanban />);
    expect(routePath(ProKanbanRoute)).toBe("/pro-kanban");
    expect(ProKanbanRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProKanbanRoute.title })).toBeTruthy();
    expect(document.title).toBe("Kanban · Stackra Playground");
  });

  it("draws three columns, each with its cards and its count, under an h2", () => {
    render(<ProKanban />);
    expect(screen.getByRole("heading", { level: 2, name: "Board" })).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["To do", "In progress", "Done"]);
    for (const column of ["To do", "In progress", "Done"]) expect(cards(column)).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="kanban-column-count"]')).toHaveLength(3);
  });

  it("moves a card to the next column from its button, and says so", () => {
    render(<ProKanban />);
    fireEvent.click(
      screen.getByRole("button", { name: "Move to In progress: Write the release notes" }),
    );
    expect(cards("To do")).toHaveLength(1);
    expect(cards("In progress")).toHaveLength(3);
    expect(screen.getByRole("status").textContent).toBe(
      "Moved Write the release notes to In progress.",
    );
    const counts = [...document.querySelectorAll('[data-slot="kanban-column-count"]')];
    expect(counts.map((count) => count.textContent)).toEqual(["1", "3", "2"]);
  });

  it("gives the last column no button to move on to", () => {
    render(<ProKanban />);
    expect(
      within(screen.getByRole("grid", { name: "Done cards" })).queryAllByRole("button"),
    ).toHaveLength(0);
  });
});
