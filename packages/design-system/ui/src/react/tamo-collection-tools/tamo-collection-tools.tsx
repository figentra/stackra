/**
 * Stackra file contract:
 * Purpose: the web `TamoCollectionTools`: the "Ask Tamo" button of a DataTable or DataView, opening a popover with
 *          three tools: filter and sort in words (proposed chips, Apply), a summary of the selected rows (marked as
 *          Tamo's), and fill a column (pick the column, say how; the proposed values per row, Apply writes them
 *          through `onFill`).
 * Boundary: draws nothing without the AI module or with Tamo off for the screen. Tamo sees the shown text of the
 *           selected rows for a summary and the rows of the page for a fill, nothing else; every result is previewed
 *           and applied by the person (ADR 0021).
 * Runtime: browser
 * Governing contract: ADR 0507 (data table: ask to filter and sort, summarise selected rows, fill a column); ADR 0505;
 *          WCAG 2.2 SC 2.1.1, 4.1.3.
 */
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { Button } from "#react/button/button";
import { TamoFilterAsk } from "#react/filter-bar/tamo-filter-ask";
import { useTamo } from "#react/hooks/use-tamo";
import { useTamoTask } from "#react/hooks/use-tamo-task";
import { useUiText } from "#react/hooks/use-ui-text";
import { Popover } from "#react/popover/popover";
import { SegmentedControl } from "#react/segmented-control/segmented-control";
import { Select } from "#react/select/select";
import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";
import { TamoButton } from "#react/tamo-button/tamo-button";
import { TamoMarker } from "#react/tamo-marker/tamo-marker";
import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";
import type { TamoCollectionToolsProps } from "#react/tamo-collection-tools/tamo-collection-tools.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Tamo's tools on a collection. */
export function TamoCollectionTools<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  onFill: givenFill,
  onCellEdit,
}: TamoCollectionToolsProps<TItem>): ReactElement | null {
  const t = useUiText();
  const { locale } = useLocale();
  const tamo = useTamo();
  const [isOpen, setOpen] = useState(false);
  const [tool, setTool] = useState("filter");
  const summary = useTamoTask<string>();
  const editable = collection.visibleColumns.filter(
    (column) => !column.isRowHeader && column.isReadOnly !== true,
  );
  const [columnId, setColumnId] = useState<string | null>(null);
  if (!tamo) return null;

  const onFill =
    givenFill ??
    (onCellEdit
      ? async (changes: Readonly<Record<string, Readonly<Record<string, unknown>>>>) => {
          for (const [id, cells] of Object.entries(changes)) {
            const item = collection.rows.find((row) => row.id === id);
            if (item)
              for (const [column, value] of Object.entries(cells))
                await onCellEdit(item, column, value as Parameters<typeof onCellEdit>[2]);
          }
        }
      : undefined);

  const rowHeader =
    collection.columns.find((column) => column.isRowHeader)?.id ??
    collection.columns[0]?.id ??
    "id";
  const textOf = (item: TItem) =>
    Object.fromEntries(
      collection.visibleColumns.map((column) => [column.label, cellTextOf(item, column.id)]),
    );
  const selected = collection.rows.filter((item) => collection.state.selection.includes(item.id));
  const fillColumn = editable.find((column) => column.id === columnId) ?? editable[0];
  const tools = [
    { id: "filter", label: t(K.ask_filter) },
    { id: "summarise", label: t(K.summarise) },
    ...(onFill && editable.length > 0 ? [{ id: "fill", label: t(K.fill_column) }] : []),
  ];

  return (
    <Popover
      title={t(K.collection, { label })}
      isOpen={isOpen}
      onOpenChange={setOpen}
      placement="bottom"
      align="end"
      trigger={<TamoButton size="sm" />}
    >
      <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-3">
        <SegmentedControl
          label={t(K.actions)}
          items={tools}
          selectedKey={tool}
          onSelectionChange={setTool}
          size="sm"
          isFullWidth
        />
        {tool === "filter" ? (
          <TamoFilterAsk slot={tamo} collection={collection} onDone={() => setOpen(false)} />
        ) : null}
        {tool === "summarise" ? (
          <div className="grid gap-2">
            {selected.length === 0 ? (
              <p className="m-0 text-sm text-muted">{t(K.summarise_none)}</p>
            ) : (
              <TamoButton
                label={t(K.summarise)}
                status={summary.status}
                isDisabled={summary.status === "working"}
                onPress={() =>
                  summary.run((signal) =>
                    tamo.run("summarise", { rows: selected.map(textOf), locale }, signal),
                  )
                }
              />
            )}
            <TamoStatusLine status={summary.status} onStop={summary.stop} onRetry={summary.retry} />
            {summary.status === "ready" && summary.result !== undefined ? (
              <section aria-label={t(K.summary, { count: selected.length })} className="grid gap-2">
                <h3 className="m-0 text-sm font-medium">
                  {t(K.summary, { count: selected.length })}
                </h3>
                <p dir="auto" className="m-0 whitespace-pre-wrap text-sm">
                  {summary.result}
                </p>
                <div className="flex items-center gap-2">
                  <TamoMarker />
                  <Button size="sm" variant="ghost" onPress={summary.reset}>
                    {t(K.discard)}
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
        {tool === "fill" && fillColumn && onFill ? (
          <div className="grid gap-3">
            <Select
              label={t(K.fill_column_which)}
              items={editable.map((column) => ({ id: column.id, label: column.label }))}
              value={fillColumn.id}
              onChange={(next) => setColumnId(next)}
            />
            <TamoAskBox<Readonly<Record<string, string>>>
              label={t(K.fill_column_how)}
              placeholder={t(K.fill_column_how)}
              onAsk={async (instruction, signal) => {
                const values = await tamo.run(
                  "fill_column",
                  {
                    column: { id: fillColumn.id, label: fillColumn.label, type: fillColumn.type },
                    instruction,
                    rows: collection.rows.map((item) => ({ id: item.id, values: textOf(item) })),
                    locale,
                  },
                  signal,
                );
                return Object.keys(values).length === 0 ? null : values;
              }}
              renderProposal={(values) => (
                <div className="grid gap-1">
                  <span className="text-xs text-muted">
                    {t(K.fill_column_count, { count: Object.keys(values).length })}
                  </span>
                  <ul className="m-0 grid max-h-56 list-none gap-1 overflow-auto p-0 text-sm">
                    {collection.rows
                      .filter((item) => values[item.id] !== undefined)
                      .map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span className="truncate text-muted">{cellTextOf(item, rowHeader)}</span>
                          <span dir="auto" className="font-medium">
                            {values[item.id]}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              onApply={(values) => {
                const isNumber = fillColumn.type === "number";
                void onFill(
                  Object.fromEntries(
                    Object.entries(values).map(([id, value]) => [
                      id,
                      { [fillColumn.id]: isNumber ? Number(value) : value },
                    ]),
                  ),
                );
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>
    </Popover>
  );
}
