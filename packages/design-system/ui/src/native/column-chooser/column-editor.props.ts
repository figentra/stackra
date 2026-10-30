/**
 * Stackra file contract:
 * Purpose: `ColumnEditorProps`, the props of the native `ColumnEditor` in `column-editor.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); data-collection plan (owner, 2026-10-29).
 */
import type { ColumnEditorContractProps } from "#contracts/types/column-editor-contract-props.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** Props of the native ColumnEditor. */
export type ColumnEditorProps<TItem extends CollectionItem = CollectionItem> =
  ColumnEditorContractProps<TItem>;
