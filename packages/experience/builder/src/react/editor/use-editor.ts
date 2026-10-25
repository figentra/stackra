/**
 * Stackra file contract:
 * Purpose: `useEditor(options)`, the hook a builder surface opens its document with: one `Editor` for the life of the
 *          component and its current state, re-rendered on every change.
 * Boundary: no UI chrome: the apps' builders draw the canvas, tree or inspector from the state and call the editor's
 *           methods. The editor is created on first render from the first `options`; to open another document,
 *           remount with a `key` (the document's id). DOM-free, so React Native builders use it too. A malformed
 *           document throws `DocumentInvalidError` during render, to the nearest error boundary.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: one editor kernel); ADR 0294 (decision 15: one symbol, one entry).
 */
import { useState, useSyncExternalStore } from "react";

import type { EditorOptions, EditorState } from "#contracts/index";
import { Editor } from "#core/index";

/**
 * The document's state and its editor.
 *
 * @throws DocumentInvalidError when `options.root` is not a well-formed tree.
 * @example
 * const [state, editor] = useEditor({ root: page.root, blocks });
 * <Canvas root={state.root} onDrop={(block, parentId, index) => editor.insert(parentId, index, block)} />
 */
export function useEditor(options: EditorOptions): readonly [EditorState, Editor] {
  const [editor] = useState(() => Editor.create(options));
  const read = (): EditorState => editor.state;
  const state = useSyncExternalStore(editor.subscribe, read, read);
  return [state, editor];
}
