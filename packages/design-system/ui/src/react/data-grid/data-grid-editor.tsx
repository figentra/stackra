/**
 * Stackra file contract:
 * Purpose: the web DataGrid's in-cell editor: a text input (numbers with a decimal keypad, Arabic digits allowed), a
 *          date input or a select of the column's options, filling the cell. Enter commits and moves down
 *          (Shift+Enter up), Tab commits and moves to the next cell (Shift+Tab the previous), Escape cancels, and
 *          leaving the cell commits in place. A select commits as soon as a choice is made.
 * Boundary: plain inputs, as a spreadsheet's are: a field component's label and frame do not fit in a 36px cell. The
 *           text is parsed by the grid on commit, not here.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid typed cells); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import { useEffect, useRef, type KeyboardEvent, type ReactElement } from "react";

import type { DataGridEditorMove } from "#react/data-grid/data-grid-editor-move.type";
import type { DataGridEditorProps } from "#react/data-grid/data-grid-editor.props";

/** The input's look: it fills the cell and keeps the grid's font. */
const INPUT =
  "absolute inset-0 size-full bg-background px-2 text-sm text-foreground outline-2 -outline-offset-2";

/** The in-cell editor. */
export function DataGridEditor({
  column,
  draft,
  onDraftChange,
  onCommit,
  onCancel,
  label,
  errorId,
}: DataGridEditorProps): ReactElement {
  const input = useRef<HTMLInputElement & HTMLSelectElement>(null);
  const isDone = useRef(false);
  useEffect(() => {
    const element: HTMLElement | null = input.current;
    element?.focus();
    // The caret goes to the end of a draft typed into the cell.
    if (element instanceof HTMLInputElement && element.type === "text")
      element.setSelectionRange(element.value.length, element.value.length);
  }, []);

  const finish = (move: DataGridEditorMove) => {
    isDone.current = true;
    onCommit(move);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      isDone.current = true;
      onCancel();
    } else if (event.key === "Enter") {
      event.preventDefault();
      finish(event.shiftKey ? "up" : "down");
    } else if (event.key === "Tab") {
      event.preventDefault();
      finish(event.shiftKey ? "previous" : "next");
    }
  };
  const common = {
    ref: input,
    "aria-label": label,
    ...(errorId ? { "aria-invalid": true, "aria-describedby": errorId } : {}),
    className: `${INPUT} ${errorId ? "outline-danger" : "outline-accent"}`,
    onKeyDown,
    onBlur: () => {
      if (!isDone.current) finish("stay");
    },
    // Clipboard keys inside the input edit the text, not the grid.
    onCopy: (event: { stopPropagation: () => void }) => event.stopPropagation(),
    onCut: (event: { stopPropagation: () => void }) => event.stopPropagation(),
    onPaste: (event: { stopPropagation: () => void }) => event.stopPropagation(),
  };

  if (column.type === "select") {
    return (
      <select
        {...common}
        value={
          column.options?.find((option) => option.label === draft || option.id === draft)?.id ?? ""
        }
        onChange={(event) => {
          // The choice is the edit.
          isDone.current = true;
          onCommit("stay", event.target.value);
        }}
      >
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- reason: the blank choice clears the cell, shown blank like the empty cell; the select carries the name */}
        <option value="" />
        {column.options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      {...common}
      type={column.type === "date" ? "date" : "text"}
      inputMode={column.type === "number" ? "decimal" : undefined}
      dir={column.type === "number" || column.type === "date" ? "ltr" : "auto"}
      value={draft}
      onChange={(event) => onDraftChange(event.target.value)}
    />
  );
}
