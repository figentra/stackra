/**
 * Stackra file contract:
 * Purpose: the page of the Kanban route: `@stackra-pro/ui`'s Kanban with three columns of cards that move between
 *          columns by dragging (HeroUI Pro's drag and drop) or, for keyboard and assistive-technology users, by a
 *          button on each card, with each column's card count and a line that says what moved.
 * Boundary: presentation and local state only. The buttons are the page's non-dragging way to move a card (WCAG 2.2,
 *          2.5.7); HeroUI Pro's board has none of its own.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import { Button } from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProKanbanRoute } from "#src/routes/pro-kanban/pro-kanban.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-kanban.*` keys.
const STRINGS = {
  documentTitle: `${ProKanbanRoute.title} · Stackra Playground`,
  intro:
    "A board of cards in columns. Drag a card to another column, or use the button on a card to move it to the next one.",
  board: "Board",
  cards: (column: string) => `${column} cards`,
  empty: "No cards.",
  moveTo: (column: string) => `Move to ${column}`,
  moved: (card: string, column: string) => `Moved ${card} to ${column}.`,
} as const;

/** One card of the board. */
interface Task {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly column: string;
}

const COLUMNS = [
  { id: "todo", title: "To do", indicator: "bg-warning" },
  { id: "doing", title: "In progress", indicator: "bg-accent" },
  { id: "done", title: "Done", indicator: "bg-success" },
] as const;

const TASKS: Task[] = [
  { id: "t1", title: "Write the release notes", owner: "Ada", column: "todo" },
  { id: "t2", title: "Review the pricing page", owner: "Grace", column: "todo" },
  { id: "t3", title: "Fix the invoice export", owner: "Alan", column: "doing" },
  { id: "t4", title: "Migrate the billing job", owner: "Margaret", column: "doing" },
  { id: "t5", title: "Set up the staging site", owner: "Edsger", column: "done" },
  { id: "t6", title: "Archive last quarter's reports", owner: "Barbara", column: "done" },
];

/** The board's state, as `useKanban` returns it. */
type Board = ReturnType<typeof UiPro.useKanban<Task>>;

/** One column: its header with the card count, and its cards, each with a button to the next column. */
function BoardColumn({
  column,
  next,
  board,
  onMove,
}: {
  column: (typeof COLUMNS)[number];
  next: (typeof COLUMNS)[number] | undefined;
  board: Board;
  onMove: (card: Task, column: string) => void;
}) {
  const { dragAndDropHooks, items } = UiPro.useKanbanColumn(board, column.id);

  return (
    <UiPro.Kanban.Column>
      <UiPro.Kanban.ColumnHeader>
        <UiPro.Kanban.ColumnIndicator className={column.indicator} />
        <UiPro.Kanban.ColumnTitle>{column.title}</UiPro.Kanban.ColumnTitle>
        <UiPro.Kanban.ColumnCount>{items.length}</UiPro.Kanban.ColumnCount>
      </UiPro.Kanban.ColumnHeader>
      <UiPro.Kanban.ColumnBody>
        <UiPro.Kanban.CardList
          label={STRINGS.cards(column.title)}
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => STRINGS.empty}
        >
          {(task) => (
            <UiPro.Kanban.Card textValue={task.title}>
              <span className="font-semibold text-foreground">{task.title}</span>
              <span className="text-sm text-muted">{task.owner}</span>
              {next ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  label={`${STRINGS.moveTo(next.title)}: ${task.title}`}
                  onPress={() => onMove(task, next.id)}
                >
                  {STRINGS.moveTo(next.title)}
                </Button>
              ) : null}
            </UiPro.Kanban.Card>
          )}
        </UiPro.Kanban.CardList>
      </UiPro.Kanban.ColumnBody>
    </UiPro.Kanban.Column>
  );
}

/** The Kanban page. */
export function ProKanban() {
  const [moved, setMoved] = useState("");
  const board = UiPro.useKanban<Task>({
    initialItems: TASKS,
    getColumn: (task) => task.column,
    setColumn: (task, column) => ({ ...task, column }),
  });

  const move = (card: Task, column: string) => {
    board.moveItem(card.id, column);
    setMoved(
      STRINGS.moved(card.title, COLUMNS.find((entry) => entry.id === column)?.title ?? column),
    );
  };

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProKanbanRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="board-heading" className="grid gap-3">
        <h2 id="board-heading" className="type-h2">
          {STRINGS.board}
        </h2>
        <UiPro.Kanban>
          {COLUMNS.map((column, index) => (
            <BoardColumn
              key={column.id}
              column={column}
              next={COLUMNS[index + 1]}
              board={board}
              onMove={move}
            />
          ))}
        </UiPro.Kanban>
        <p role="status" className="text-muted">
          <bdi>{moved}</bdi>
        </p>
      </section>
    </article>
  );
}
