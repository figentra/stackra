/**
 * Stackra file contract:
 * Purpose: `useSelection(editor)`, the selected block ids for a part of a builder that follows the selection only (an
 *          inspector, a toolbar): it re-renders when the selection changes, not on every edit.
 * Boundary: reads `editor.state.selection`, which keeps its identity until the selection changes; select through
 *           `editor.select(ids)`. DOM-free, so React Native builders use it too.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: selection); ADR 0294 (decision 15: one symbol, one entry).
 */
import { useSyncExternalStore } from "react";

import type { Editor } from "#core/index";

/**
 * The ids of `editor`'s selected blocks, in selection order.
 *
 * @example
 * const [selected] = useSelection(editor);
 * const block = selected === undefined ? undefined : editor.node(selected);
 */
export function useSelection(editor: Editor): readonly string[] {
  const read = (): readonly string[] => editor.state.selection;
  return useSyncExternalStore(editor.subscribe, read, read);
}
