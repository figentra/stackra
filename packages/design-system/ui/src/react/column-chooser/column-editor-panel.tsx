/**
 * Stackra file contract:
 * Purpose: the web `ColumnEditorPanel`, the content of the collection family's column editor: a list of every column, dragged
 *          by its handle to reorder (or from the keyboard: focus the handle, Enter, arrows, Enter), ticked to show or
 *          hide, and opened (press the row) to rename it, pin it to the start or end or unpin it, set its width or fit it
 *          to its content, and wrap or truncate its text; "Reset columns" puts them all back as defined.
 * Boundary: every change goes to the `useCollection` engine it is given, so the table, grid and list follow at once.
 *           The list is React Aria's `GridList` with its drag and drop (and its spoken announcements) and no
 *           selection, so a drag moves only the row it lifts; each row's own "Show" checkbox sets its visibility, and
 *           the row header cannot be hidden. The settings of the opened column sit under the
 *           list, outside the grid, so its fields take every key. The drop line and the lifted row follow SortableList;
 *           the row settles with `motion`'s layout spring, still under prefers-reduced-motion.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0165 (React Aria on web);
 *          ADR 0329 (motion layer); WCAG 2.2 SC 1.3.1, 2.1.1, 2.5.7, 4.1.2.
 */
import { Checkbox as HeroCheckbox, cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { motionSpring, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
} from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { fitColumnWidth } from "#core/functions/fit-column-width.function";
import { Button } from "#react/button/button";
import type { ColumnEditorProps } from "#react/column-chooser/column-editor.props";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { useColumnEditorState } from "#react/hooks/use-column-editor-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { NumberField } from "#react/number-field/number-field";
import { SegmentedControl } from "#react/segmented-control/segmented-control";
import { Switch } from "#react/switch/switch";
import { TextField } from "#react/text-field/text-field";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The spring a row settles with after a drop. */
const SETTLE = { type: "spring", ...motionSpring(STACKRA_THEME, "snappy") } as const;

/** The column editor's content (the list and the opened column's settings), for a popover or a drawer. */
export function ColumnEditorPanel<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
}: ColumnEditorProps<TItem>): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const { name, openId, open, toggle, setShown, rename, pinItems, setPin } = useColumnEditorState(
    collection,
    label,
  );
  const { columns } = collection;
  const labelOf = (id: unknown) => columns.find((column) => column.id === id)?.label ?? "";

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ "text/plain": labelOf(key) })),
    onReorder: ({ keys, target }) => {
      const moved = [...keys].map(String);
      const rest = columns.map((column) => column.id).filter((id) => !moved.includes(id));
      const at = rest.indexOf(String(target.key)) + (target.dropPosition === "after" ? 1 : 0);
      collection.reorderColumns([...rest.slice(0, at), ...moved, ...rest.slice(at)]);
    },
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="h-0.5 bg-accent opacity-0 data-[drop-target]:opacity-100"
      />
    ),
    renderDragPreview: (dragged) => (
      <div
        className="scale-[1.02] bg-overlay px-4 py-2 text-foreground shadow-overlay"
        style={{ borderRadius: "var(--radius-control)" }}
      >
        {dragged[0]?.["text/plain"]}
      </div>
    ),
  });

  return (
    <IconRegistryProvider registry={COLLECTION_ICONS}>
      <div className="grid w-full gap-3" data-slot="column-editor">
        <p className="m-0 text-sm text-muted">{t(K.editor_hint)}</p>
        <GridList
          aria-label={name}
          items={columns}
          // No grid selection: React Aria drags every selected row, so visibility is each row's own checkbox and a
          // drag moves only the row it lifts.
          selectionMode="none"
          onAction={(key) => toggle(String(key))}
          dragAndDropHooks={dragAndDropHooks}
          className="flex max-h-72 flex-col overflow-auto rounded-[var(--radius-container)] border border-separator"
        >
          {(column) => (
            <GridListItem
              id={column.id}
              textValue={column.label}
              className={
                cn(
                  "border-b border-separator bg-surface text-foreground outline-none last:border-b-0",
                  "data-[focus-visible]:[outline-style:var(--focus-ring-style)] data-[focus-visible]:outline-(length:--focus-ring-width) data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-focus",
                  "data-[dragging]:opacity-(--opacity-subtle)",
                  openId === column.id && "bg-accent-soft",
                ) ?? ""
              }
            >
              <motion.div
                layout={!isReduced}
                transition={SETTLE}
                className="flex min-h-11 items-center gap-1 pe-2"
              >
                <AriaButton
                  slot="drag"
                  aria-label={t(UI_KEYS.ui.sortable_list.handle, { label: column.label })}
                  className="inline-flex size-10 shrink-0 cursor-grab items-center justify-center text-muted"
                >
                  <Icon name="grip-vertical" size="sm" />
                </AriaButton>
                <HeroCheckbox
                  isSelected={!column.isHidden}
                  onChange={(isShown) => setShown(column.id, isShown)}
                  isDisabled={!column.canHide}
                  aria-label={t(K.show_column, { label: column.label })}
                >
                  <HeroCheckbox.Content className="inline-flex min-h-6 min-w-6 items-center justify-center">
                    <HeroCheckbox.Control>
                      <HeroCheckbox.Indicator />
                    </HeroCheckbox.Control>
                  </HeroCheckbox.Content>
                </HeroCheckbox>
                <span className="min-w-0 flex-1 truncate ps-2 text-sm">{column.label}</span>
                {column.pin ? (
                  <span
                    className="inline-flex text-muted"
                    title={t(column.pin === "start" ? K.pin_start : K.pin_end)}
                  >
                    <Icon
                      name="pin"
                      size="sm"
                      label={t(column.pin === "start" ? K.pin_start : K.pin_end)}
                    />
                  </span>
                ) : null}
                <IconButton
                  icon="pencil"
                  size="sm"
                  variant="ghost"
                  label={t(K.rename_column, { label: column.label })}
                  onPress={() => toggle(column.id)}
                />
              </motion.div>
            </GridListItem>
          )}
        </GridList>
        {open ? (
          <fieldset
            className="m-0 grid gap-3 rounded-[var(--radius-container)] border border-separator p-3"
            aria-label={open.label}
          >
            <legend className="sr-only">{open.label}</legend>
            <TextField
              label={t(K.column_name)}
              value={open.label === open.defaultLabel ? "" : open.label}
              placeholder={open.defaultLabel}
              onChange={rename}
            />
            <SegmentedControl
              label={t(K.pin)}
              size="sm"
              isFullWidth
              selectedKey={open.pin ?? "none"}
              onSelectionChange={setPin}
              items={pinItems}
            />
            <div className="flex items-end gap-2">
              <NumberField
                label={t(K.width)}
                placeholder={t(K.width_auto)}
                value={open.width ?? null}
                minValue={open.minWidth ?? 64}
                maxValue={open.maxWidth ?? 640}
                step={8}
                onChange={(value) =>
                  collection.updateColumn(
                    open.id,
                    value === null ? { width: undefined } : { width: value },
                  )
                }
              />
              <Button
                variant="secondary"
                size="sm"
                onPress={() =>
                  collection.updateColumn(open.id, { width: fitColumnWidth(open, collection.rows) })
                }
              >
                {t(K.fit_width)}
              </Button>
            </div>
            <Switch
              label={t(K.wrap)}
              value={open.wrap === true}
              onChange={(wrap) => collection.updateColumn(open.id, { wrap })}
            />
          </fieldset>
        ) : null}
        <div>
          <Button
            variant="ghost"
            size="sm"
            startIcon="rotate-ccw"
            onPress={collection.resetColumns}
          >
            {t(K.reset_columns)}
          </Button>
        </div>
      </div>
    </IconRegistryProvider>
  );
}
