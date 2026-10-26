/**
 * Stackra file contract:
 * Purpose: `useDocumentEditor`, the hook that opens a structured document (an automation, a form) in a
 *          `DocumentEditor` and re-renders on each change.
 * Boundary: no DOM, so web and React Native surfaces use it alike. The editor is made once per mount: to open another
 *           document, remount with a `key`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 3); ADR 0270 (decision 4).
 */
import { useState, useSyncExternalStore } from "react";

import type { DocumentEditorOptions, DocumentEditorState } from "#contracts/index";
import { DocumentEditor } from "#core/index";

/**
 * The open document's state and its editor.
 *
 * @example
 * const [state, editor] = useDocumentEditor({ document: automation, check: automationProblems });
 */
export function useDocumentEditor<T>(
  options: DocumentEditorOptions<T>,
): readonly [DocumentEditorState<T>, DocumentEditor<T>] {
  const [editor] = useState(() => DocumentEditor.create(options));
  const read = (): DocumentEditorState<T> => editor.state;
  const state = useSyncExternalStore(editor.subscribe, read, read);
  return [state, editor];
}
