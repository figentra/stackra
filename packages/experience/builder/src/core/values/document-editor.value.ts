/**
 * Stackra file contract:
 * Purpose: `DocumentEditor`, the kernel of a structured document kind that is not a block tree: an automation, a form.
 *          It holds the document, replaces it whole on each change with undo and redo, reports the problems its check
 *          finds, and notifies subscribers, so the studio's automation editor and form editor are surfaces over it.
 * Boundary: data only and controlled by its changes: a change is a whole next document (the surface builds it), so
 *           the kind's own shape stays the kind's. Documents are frozen and replaced, never mutated; `state` is a
 *           `useSyncExternalStore` snapshot. It renders nothing and saves nothing: the host saves through the kind's
 *           service (`AutomationService.draft`, the form's content type), which refuses what `problems()` reports.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 3); ADR 0270 (decisions 4 and 6: one kernel, a field list for forms and a
 *                     step list for automations).
 */
import type { FieldErrors } from "@stackra/errors";

import type { DocumentEditorOptions, DocumentEditorState } from "#contracts/index";

/** Undo steps kept; older ones are dropped so a long session does not grow without bound. */
const MAX_UNDO = 200;

/**
 * One open structured document.
 *
 * @example
 * const editor = DocumentEditor.create({ document: automation, check: automationProblems });
 * editor.change({ ...editor.state.document, steps: [...editor.state.document.steps, step] });
 * editor.problems(); // { "steps.2.block": "block_unknown" }
 * editor.undo();
 */
export class DocumentEditor<T> {
  /** Calls `listener` after every change, undo and redo; returns the unsubscribe. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** The kind's check. */
  private readonly check: (document: T) => FieldErrors;

  /** The state subscribers read. */
  private current: DocumentEditorState<T>;

  /** Earlier documents, newest last. */
  private readonly undoStack: T[] = [];

  /** Undone documents, newest last. */
  private readonly redoStack: T[] = [];

  /** Who is told of each change. */
  private readonly listeners = new Set<() => void>();

  /** Opens `document`. */
  private constructor(document: T, check: (document: T) => FieldErrors) {
    this.check = check;
    this.current = DocumentEditor.stateOf(document, false, false);
  }

  /** Opens `options.document` with its kind's check. */
  static create<T>(options: DocumentEditorOptions<T>): DocumentEditor<T> {
    return new DocumentEditor(options.document, options.check);
  }

  /** The frozen state snapshot. */
  private static stateOf<T>(
    document: T,
    canUndo: boolean,
    canRedo: boolean,
  ): DocumentEditorState<T> {
    return Object.freeze({ document, canUndo, canRedo });
  }

  /** The document, and whether undo and redo are possible. */
  get state(): DocumentEditorState<T> {
    return this.current;
  }

  /** Replaces the document with `next`, as one undoable step; a change to the same reference does nothing. */
  change(next: T): void {
    if (next === this.current.document) return;
    this.undoStack.push(this.current.document);
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack.length = 0;
    this.set(next);
  }

  /** Takes the last change back; nothing when there is none. */
  undo(): void {
    const previous = this.undoStack.pop();
    if (previous === undefined) return;
    this.redoStack.push(this.current.document);
    this.set(previous);
  }

  /** Takes the last undone change again; nothing when there is none. */
  redo(): void {
    const next = this.redoStack.pop();
    if (next === undefined) return;
    this.undoStack.push(this.current.document);
    this.set(next);
  }

  /** The document's problems by path, from its kind's check; `{}` when it has none. */
  problems(): FieldErrors {
    return this.check(this.current.document);
  }

  /** Stores `document` as the state and notifies. */
  private set(document: T): void {
    this.current = DocumentEditor.stateOf(
      document,
      this.undoStack.length > 0,
      this.redoStack.length > 0,
    );
    for (const listener of this.listeners) listener();
  }
}
