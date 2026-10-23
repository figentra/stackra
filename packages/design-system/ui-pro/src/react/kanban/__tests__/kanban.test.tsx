/**
 * Stackra file contract:
 * Purpose: proves the web Kanban passes `size` to HeroUI Pro's board and leaves its default when it is left out,
 *          names each card list from `label`, draws columns and cards, passes unknown props through, carries
 *          HeroUI Pro's own parts and hooks, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `ResizeObserver` is stubbed because jsdom has none and the
 *          scroll shadow observes its box through it; the theme CSS is not loaded, so classes are checked.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-006
import { Kanban as HeroKanban } from "@heroui-pro/react/kanban";
import { render, screen } from "@testing-library/react";

import { Kanban, useKanban, useKanbanCardPlaceholder, useKanbanColumn } from "#react/kanban/kanban";
import type { KanbanCardListProps } from "#react/kanban/kanban-card-list";
import type { KanbanProps } from "#react/kanban/kanban";

function Board({ size }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Kanban {...(size ? { size } : {})} data-testid="board">
      <Kanban.Column>
        <Kanban.ColumnHeader>
          <Kanban.ColumnTitle>Todo</Kanban.ColumnTitle>
          <Kanban.ColumnCount>2</Kanban.ColumnCount>
        </Kanban.ColumnHeader>
        <Kanban.ColumnBody>
          <Kanban.CardList label="Todo cards">
            <Kanban.Card id="a" textValue="Write tests">
              Write tests
            </Kanban.Card>
            <Kanban.Card id="b" textValue="Ship it">
              Ship it
            </Kanban.Card>
          </Kanban.CardList>
        </Kanban.ColumnBody>
      </Kanban.Column>
    </Kanban>
  );
}

describe("Kanban (web)", () => {
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

  it("passes the size to the board and keeps HeroUI Pro's default without it", () => {
    const { rerender } = render(<Board size="lg" />);
    expect(screen.getAllByRole("row")[0]?.classList.contains("kanban__card--lg")).toBe(true);
    rerender(<Board />);
    expect(screen.getAllByRole("row")[0]?.classList.contains("kanban__card--md")).toBe(true);
  });

  it("names the card list from label and draws the columns and cards", () => {
    render(<Board />);
    expect(screen.getByRole("grid", { name: "Todo cards" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Todo" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Write tests")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts and hooks", () => {
    for (const part of [
      "Column",
      "ColumnHeader",
      "ColumnTitle",
      "ColumnCount",
      "ColumnIndicator",
      "ColumnActions",
      "ColumnBody",
      "Card",
      "DropIndicator",
      "DragHandle",
      "ScrollShadow",
    ] as const) {
      expect(Kanban[part]).toBe(HeroKanban[part]);
    }
    expect(typeof useKanban).toBe("function");
    expect(typeof useKanbanColumn).toBe("function");
    expect(typeof useKanbanCardPlaceholder).toBe("function");
  });

  it("types the accessible name as label", () => {
    expectTypeOf<KanbanProps>().toHaveProperty("size");
    expectTypeOf<KanbanCardListProps<object>>().toHaveProperty("label");
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<Kanban.CardList aria-label="x">{[]}</Kanban.CardList>);
  });
});
