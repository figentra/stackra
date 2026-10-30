/**
 * Stackra file contract:
 * Purpose: `useColumnEditorState(collection, label)`, the state every runtime's column editor shares: its name, the
 *          column opened for its settings (pressing the opened one again closes it), and the changes a row and the
 *          settings make: show or hide, rename, and pin to the start, the end or neither, with the pin choices in
 *          the reader's words.
 * Boundary: a React hook with no rendering; every change goes to the `useCollection` engine it is given. Reordering is
 *           each runtime's own (React Aria's drop target on web, `SortableList` on native). The web ColumnEditorPanel
 *           and the native ColumnEditor both use it.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3).
 */
import { useState } from "react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/**
 * The shared column editor state.
 * @param collection - the engine whose columns the editor arranges
 * @param label - the caller's name for the editor; "Columns" when left out
 * @returns the name, the opened column and the changes the rows and the settings make
 */
export function useColumnEditorState<TItem extends CollectionItem = CollectionItem>(
  collection: CollectionController<TItem>,
  label: string | undefined,
): {
  readonly name: string;
  readonly openId: string | null;
  readonly open: ResolvedCollectionColumn | undefined;
  readonly setOpenId: (id: string | null) => void;
  readonly toggle: (id: string) => void;
  readonly setShown: (id: string, isShown: boolean) => void;
  readonly rename: (value: string) => void;
  readonly pinItems: readonly { readonly id: "start" | "none" | "end"; readonly label: string }[];
  readonly setPin: (key: unknown) => void;
} {
  const t = useUiText();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = collection.columns.find((column) => column.id === openId);
  return {
    name: label ?? t(DATA_GRID_KEYS.ui.data_table_tools.columns),
    openId,
    open,
    setOpenId,
    toggle: (id) => setOpenId(openId === id ? null : id),
    setShown: (id, isShown) => collection.updateColumn(id, { isHidden: !isShown }),
    rename: (value) => {
      if (open) collection.updateColumn(open.id, { label: value });
    },
    pinItems: [
      { id: "start", label: t(K.pin_start) },
      { id: "none", label: t(K.pin_none) },
      { id: "end", label: t(K.pin_end) },
    ],
    setPin: (key) => {
      if (open)
        collection.updateColumn(open.id, { pin: key === "start" || key === "end" ? key : null });
    },
  };
}
