/**
 * Stackra file contract:
 * Purpose: the DataTable's inline cell editor: the DataGrid's own in-cell editor (`DataGridEditor`, its keys and its
 *          typed inputs) laid over a table cell, the value parsed by `parseGridValue` and checked by `gridCellErrorOf`
 *          as the grid does. Enter, Tab or leaving the cell commits a valid value; an invalid one keeps the editor open,
 *          marks the input invalid and says why in an alert drawn inside the editor, at its end (the text stops short of
 *          it), so the message never covers another cell; Escape drops the edit. A message wider than half the cell is
 *          cut with an ellipsis on screen and read whole, as the input's description.
 * Boundary: drawn in a portal on the body at the cell's box, kept on it while the table or page scrolls and the window
 *           resizes (`useAnchorBox`), so React Aria's grid keys (arrows, typeahead, selection) never act on keys typed
 *           in it: its handlers ignore events from outside the grid's DOM. It never writes the row: the table hands the
 *           value to the app.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (inline edit, sharing the DataGrid's editors);
 *          ADR 0317 amendment 2026-10-28 (wave 3d); WCAG 2.2 SC 2.1.1, 3.3.1, 4.1.2, 4.1.3.
 */
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import { gridCellErrorOf } from "#core/functions/grid-cell-error-of.function";
import { parseGridValue } from "#core/functions/parse-grid-value.function";
import { DataGridEditor } from "#react/data-grid/data-grid-editor";
import { useGridErrorText } from "#react/data-grid/use-grid-error-text";
import type { DataTableCellEditorProps } from "#react/data-table/data-table-cell-editor.props";
import { useAnchorBox } from "#react/data-table/use-anchor-box";

/** The text a value is edited as: a select's option id, a number or day as written, nothing for empty. */
const draftOf = (value: DataGridValue | undefined): string =>
  value === null || value === undefined ? "" : String(value);

/** A DataGrid editor over one DataTable cell. */
export function DataTableCellEditor({
  column,
  row,
  anchor,
  label,
  locale,
  onCommit,
  onCancel,
}: DataTableCellEditorProps): ReactElement {
  const [draft, setDraft] = useState(() => draftOf(row[column.id]));
  const [error, setError] = useState<string | null>(null);
  // A failed commit remounts the editor, so it takes focus again and commits on the next Enter, Tab or blur.
  const [attempt, setAttempt] = useState(0);
  const wordsOf = useGridErrorText(locale);
  const box = useAnchorBox(anchor);
  const errorId = useId();
  const bubble = useRef<HTMLParagraphElement>(null);
  // The message's width, which the input's text keeps clear of.
  const [errorWidth, setErrorWidth] = useState(0);
  useLayoutEffect(() => {
    setErrorWidth(error ? (bubble.current?.getBoundingClientRect().width ?? 0) : 0);
  }, [error]);

  const commit = (_move: unknown, chosen?: string) => {
    const text = chosen ?? draft;
    const value = parseGridValue(text, column);
    const found = gridCellErrorOf(value, column, { ...row, [column.id]: value });
    if (found) {
      setDraft(text);
      setError(wordsOf(found));
      setAttempt((count) => count + 1);
      return;
    }
    onCommit(value);
  };

  return createPortal(
    <div
      data-slot="data-table-cell-editor"
      className="fixed z-(--z-overlay) [&>input]:pe-[var(--editor-error)] [&>select]:pe-[var(--editor-error)]"
      style={
        {
          top: box.top,
          left: box.left,
          width: box.width,
          height: box.height,
          "--editor-error": error ? `${Math.ceil(errorWidth) + 12}px` : undefined,
        } as CSSProperties
      }
    >
      <DataGridEditor
        key={attempt}
        column={column}
        draft={draft}
        onDraftChange={setDraft}
        onCommit={commit}
        onCancel={onCancel}
        label={label}
        errorId={error ? errorId : undefined}
      />
      {error ? (
        <p
          ref={bubble}
          id={errorId}
          role="alert"
          className="pointer-events-none absolute inset-y-0 end-1 my-auto h-fit max-w-[50%] truncate rounded-[var(--radius-control)] bg-danger px-1.5 py-0.5 text-xs text-danger-foreground"
        >
          {error}
        </p>
      ) : null}
    </div>,
    anchor.ownerDocument.body,
  );
}
