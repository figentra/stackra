/**
 * Stackra file contract:
 * Purpose: the web `SortableList` on React Aria's `GridList` drag and drop: rows reordered by dragging their handle,
 *          or from the keyboard and a screen reader (focus the handle, Enter to pick up, arrows to move, Enter to
 *          drop), with React Aria's own spoken announcements. The picked-up row lifts (scale 1.02 and the overlay
 *          shadow) as the drag preview, the drop target shows a line, and every row springs to its new place.
 * Boundary: controlled only: a drop calls `onReorder` with every row in the new order and draws nothing until the
 *           app passes it back. The spring is `motion`'s layout animation and stops under prefers-reduced-motion;
 *           the web has no haptics. The handle's name comes from the `ui` catalogue in the active locale.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (React Aria on web); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 10; WCAG 2.2 SC 2.1.1, 2.5.7, 4.1.2, 4.1.3.
 */
import { cn } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
} from "react-aria-components";

import type { SortableListItem } from "#contracts/types/sortable-list-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { reorderItems } from "#core/functions/reorder-items.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { SortableListProps } from "#react/sortable-list/sortable-list.props";

/** The spring a row settles with after a drop. */
const SETTLE = { type: "spring", stiffness: 500, damping: 38 } as const;

/** Rows reordered by drag, keyboard or screen reader. */
export function SortableList<TItem extends SortableListItem>({
  items,
  onReorder,
  label,
  renderItem,
  isDisabled = false,
  className,
  ...rest
}: SortableListProps<TItem>): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const labelOf = (id: unknown) => items.find((item) => item.id === id)?.label ?? "";

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": labelOf(key) })),
    onReorder: ({ keys, target }) => {
      const next = reorderItems(items, keys, target.key, target.dropPosition);
      if (next !== items) onReorder(next);
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="h-0.5 bg-accent opacity-0 data-[drop-target]:opacity-100"
      />
    ),
    // The lift: the dragged row's own look, a touch larger and raised on the overlay shadow.
    renderDragPreview: (dragged) => (
      <div
        className="scale-[1.02] bg-overlay px-4 py-3 text-foreground shadow-overlay"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        {dragged[0]?.["text/plain"]}
      </div>
    ),
  });

  return (
    <GridList
      {...rest}
      aria-label={label}
      items={items}
      {...(isDisabled ? {} : { dragAndDropHooks })}
      disabledKeys={items.filter((item) => item.isDisabled).map((item) => item.id)}
      className={cn("flex flex-col divide-y divide-separator", className) ?? ""}
    >
      {(item) => (
        <GridListItem
          id={item.id}
          textValue={item.label}
          className={
            cn(
              "bg-surface text-foreground outline-none",
              "data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
              "data-[dragging]:opacity-40 data-[disabled]:opacity-60",
            ) ?? ""
          }
        >
          <motion.div
            layout={!isReduced}
            transition={SETTLE}
            className="flex items-center gap-3 px-2 py-2"
          >
            {isDisabled ? null : (
              <AriaButton
                slot="drag"
                aria-label={t(UI_KEYS.ui.sortable_list.handle, { label: item.label })}
                className="inline-flex size-10 shrink-0 cursor-grab items-center justify-center text-muted data-[disabled]:cursor-not-allowed"
              >
                <Icon name="grip-vertical" size="sm" />
              </AriaButton>
            )}
            <div className="min-w-0 flex-1">
              {renderItem ? (
                renderItem(item)
              ) : (
                <>
                  <div className="truncate">{item.label}</div>
                  {item.description ? (
                    <div className="truncate text-sm text-muted">{item.description}</div>
                  ) : null}
                </>
              )}
            </div>
          </motion.div>
        </GridListItem>
      )}
    </GridList>
  );
}
