/**
 * Stackra file contract:
 * Purpose: `useInspector(editor)`, the hook behind a builder's property panel: for the selected block it returns the
 *          descriptors of its props (`inspectorFieldsOf` over the block's registered schema), their current values and
 *          `set(key, value)`.
 * Boundary: no UI chrome: the console renders the controls with @stackra/ui from the descriptors. It follows the
 *           first selected block and re-renders on every edit, so the values stay current; `set` goes through
 *           `editor.setProp`, so each edit is undoable and reported through `onChange` like any other. The block's
 *           schema must be registered, as `Editor.problems` needs. DOM-free, so React Native builders use it too.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the block inspector, one undo and redo command stack); ADR 0294
 *                     (decision 15: one symbol, one entry).
 */
import type { Json } from "@stackra/contracts";
import { schemaOf } from "@stackra/validation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { EditorState, Inspector } from "#contracts/index";
import { type Editor, inspectorFieldsOf } from "#core/index";

/** An empty props map, so an unselected inspector keeps one identity. */
const NO_VALUES: Readonly<Record<string, Json>> = Object.freeze({});

/**
 * The inspector of `editor`'s selected block.
 *
 * @throws TypeError when the selected block's schema is not registered (run `stackra gen`).
 * @example
 * const { fields, values, set } = useInspector(editor);
 * fields.map((field) => <FieldControl key={field.key} field={field} value={values[field.key]} onChange={(next) => set(field.key, next)} />);
 */
export function useInspector(editor: Editor): Inspector {
  const read = (): EditorState => editor.state;
  const state = useSyncExternalStore(editor.subscribe, read, read);
  const id = state.selection[0];
  const node = id === undefined ? undefined : editor.node(id);
  const block = node?.block;
  const fields = useMemo(() => {
    const type = block === undefined ? undefined : editor.blockClass(block);
    return type === undefined ? [] : inspectorFieldsOf(schemaOf(type));
  }, [editor, block]);
  const set = useCallback(
    (key: string, value: Json | undefined): void => {
      if (id !== undefined) editor.setProp(id, key, value);
    },
    [editor, id],
  );
  return { id: node?.id, fields, values: node?.props ?? NO_VALUES, set };
}
