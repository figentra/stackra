/**
 * Stackra file contract:
 * Purpose: `DataGridEditorProps`, the props of the web DataGrid's in-cell editor.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid typed cells).
 */
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridEditorMove } from "#react/data-grid/data-grid-editor-move.type";

/** Props of the in-cell editor. */
export interface DataGridEditorProps {
  /** The column, which picks the input. */
  readonly column: DataGridColumn;
  /** The text being edited. */
  readonly draft: string;
  /** Called as the text changes. */
  readonly onDraftChange: (draft: string) => void;
  /** Commits the draft (or `draft`, when a select hands its choice straight over) and moves on. */
  readonly onCommit: (move: DataGridEditorMove, draft?: string) => void;
  /** Drops the draft. */
  readonly onCancel: () => void;
  /** The input's accessible name: the column and the row. */
  readonly label: string;
  /** The id of the element that says why the draft is refused; given, the input is marked invalid and described by it. */
  readonly errorId?: string | undefined;
}
