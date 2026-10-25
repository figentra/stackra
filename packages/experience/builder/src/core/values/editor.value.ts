/**
 * Stackra file contract:
 * Purpose: `Editor`, the editor kernel every builder surface (canvas, document, grid, tree, graph) drives: one open
 *          document as a tree of block instances, changed only by insert, move, remove and set-prop, with an undo and
 *          redo stack, a selection, and a check of every block against the registered blocks, the document's kind and
 *          a reviewed block kit.
 * Boundary: a value built with `Editor.create`, never injected; one per open document. It renders nothing (the apps'
 *           builders draw the chrome) and loads no CRDT library: a shared document is bound by `./react`. Its state is
 *           a frozen snapshot replaced on each change, for `useSyncExternalStore`. Local changes are reported through
 *           `onChange`; `replace` (a co-editor's tree) is not, and is never undone. An undo or redo whose block a
 *           co-editor removed meanwhile is skipped. Props are checked by `problems`, not on every edit, so a block
 *           may be incomplete while it is being filled in; publishing refuses what `problems` reports.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1, 3, 4 and 6); COM-358; ADR 0154 (documents reference registered code only); ADR 0328
 *                     (values are built with `create`).
 */
import type { AnyClass } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import { type FieldErrors, isRefusal } from "@stackra/errors";
import { blockKinds } from "@stackra/experience";
import type { DocumentNode } from "@stackra/experience/contracts";
import { validate } from "@stackra/validation";

import {
  type EditorChange,
  EditorChangeKind,
  type EditorNode,
  type EditorOptions,
  type EditorState,
} from "#contracts/index";
import { BlockNotAllowedError } from "#core/errors/block-not-allowed.error";
import { BlockNotRegisteredError } from "#core/errors/block-not-registered.error";
import { applyChange } from "#core/functions/apply-change.function";
import { blockIds } from "#core/functions/block-ids.function";
import { parseDocumentNode } from "#core/functions/parse-document-node.function";
import type { AppliedChange } from "#core/types/applied-change.type";

/** Undo steps kept; older ones are dropped so a long session does not grow without bound. */
const MAX_UNDO = 200;

/** The block `id` under `node` (`node` included), or `undefined`. */
function find(node: EditorNode, id: string): EditorNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = find(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * One open document.
 *
 * @example
 * const editor = Editor.create({ root: page.root, blocks });
 * const hero = editor.insert(editor.state.root.id, 0, "web.hero_section");
 * editor.setProp(hero, "title", { "en-US": "Summer camp" });
 * editor.select([hero]);
 * editor.undo(); // the title is cleared again
 * editor.problems(); // { "<hero id>.title": "invalid_type", ... }
 */
export class Editor {
  private readonly blocks: ReadonlyMap<string, AnyClass>;

  private readonly options: Pick<EditorOptions, "kind" | "kit">;

  private current: EditorState;

  private readonly undoStack: EditorChange[] = [];

  private readonly redoStack: EditorChange[] = [];

  private readonly listeners = new Set<() => void>();

  private readonly changeListeners = new Set<(change: EditorChange) => void>();

  private constructor(
    root: EditorNode,
    blocks: ReadonlyMap<string, AnyClass>,
    options: Pick<EditorOptions, "kind" | "kit">,
  ) {
    this.blocks = blocks;
    this.options = options;
    this.current = Object.freeze({ root, selection: [], canUndo: false, canRedo: false });
  }

  /**
   * Opens `options.root` against `options.blocks`.
   *
   * @throws DocumentInvalidError when the root is not a well-formed tree (see `parseDocumentNode`).
   */
  static create(options: EditorOptions): Editor {
    return new Editor(parseDocumentNode(options.root), options.blocks, {
      ...(options.kind !== undefined && { kind: options.kind }),
      ...(options.kit !== undefined && { kit: options.kit }),
    });
  }

  /** The current snapshot: the tree, the selection and the undo and redo flags. */
  get state(): EditorState {
    return this.current;
  }

  /**
   * Calls `listener` after every state change; the shape `useSyncExternalStore` takes.
   *
   * @returns removes the listener.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Calls `listener` with each local change after it is applied, undo and redo included; a co-editor's tree given to
   * `replace` is not reported.
   *
   * @returns removes the listener.
   */
  onChange(listener: (change: EditorChange) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /** The registered block class for the key `block`, or `undefined`; the inspector reads its schema. */
  blockClass(block: string): AnyClass | undefined {
    return this.blocks.get(block);
  }

  /**
   * Whether the registered block `block` may be placed in this document: it fits the document's kind, when one was
   * given, and is in the reviewed kit, when one was given.
   */
  allows(block: string): boolean {
    const type = this.blocks.get(block);
    if (type === undefined) return false;
    const { kind, kit } = this.options;
    return (
      (kind === undefined || blockKinds(type).includes(kind)) &&
      (kit === undefined || kit.blocks.includes(block))
    );
  }

  /** The keys of the blocks the palette offers for this document, in code-unit order. */
  palette(): string[] {
    return [...this.blocks.keys()]
      .filter((block) => this.allows(block))
      .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  }

  /** The block `id` in the current tree, or `undefined`. */
  node(id: string): EditorNode | undefined {
    return find(this.current.root, id);
  }

  /**
   * Places a new block of the registered `block` under `parentId` at `index` (clamped), with `props`.
   *
   * @returns the new block's id.
   * @throws BlockNotRegisteredError when no registered block has the key `block`.
   * @throws BlockNotAllowedError when the document's kind or the reviewed kit does not allow `block`.
   * @throws BlockNotFoundError when the tree holds no `parentId`.
   */
  insert(
    parentId: string,
    index: number,
    block: string,
    props: Readonly<Record<string, Json>> = {},
  ): string {
    if (!this.blocks.has(block)) throw BlockNotRegisteredError.create({ block });
    if (!this.allows(block)) throw BlockNotAllowedError.create({ block });
    const node: EditorNode = Object.freeze({
      id: globalThis.crypto.randomUUID(),
      block,
      props: Object.freeze(Object.fromEntries(Object.entries(props))),
      children: Object.freeze([]),
    });
    this.perform({ kind: EditorChangeKind.Insert, parentId, index, node });
    return node.id;
  }

  /**
   * Places the block `id` under `parentId` at `index` (clamped, counted without the block itself).
   *
   * @throws BlockNotFoundError when the tree holds no `id` or no `parentId`.
   * @throws RootBlockLockedError when `id` is the root.
   * @throws BlockMoveInvalidError when `parentId` is the block or nested in it.
   */
  move(id: string, parentId: string, index: number): void {
    this.perform({ kind: EditorChangeKind.Move, id, parentId, index });
  }

  /**
   * Takes the block `id` and everything nested in it out of the tree.
   *
   * @throws BlockNotFoundError when the tree holds no `id`.
   * @throws RootBlockLockedError when `id` is the root.
   */
  remove(id: string): void {
    this.perform({ kind: EditorChangeKind.Remove, id });
  }

  /**
   * Sets the prop `name` of the block `id` to `value`, or clears it with `undefined`.
   *
   * @throws BlockNotFoundError when the tree holds no `id`.
   */
  setProp(id: string, name: string, value: Json | undefined): void {
    this.perform({ kind: EditorChangeKind.SetProp, id, name, value });
  }

  /**
   * Reverts the latest change that still applies.
   *
   * @returns whether a change was reverted.
   */
  undo(): boolean {
    return this.step(this.undoStack, this.redoStack);
  }

  /**
   * Applies again the latest reverted change that still applies.
   *
   * @returns whether a change was applied.
   */
  redo(): boolean {
    return this.step(this.redoStack, this.undoStack);
  }

  /** Selects the blocks `ids` that are in the tree, in order, once each; `[]` clears the selection. */
  select(ids: readonly string[]): void {
    const present = blockIds(this.current.root);
    const selection = [...new Set(ids)].filter((id) => present.has(id));
    const same =
      selection.length === this.current.selection.length &&
      selection.every((id, index) => id === this.current.selection[index]);
    if (same) return;
    this.current = Object.freeze({ ...this.current, selection: Object.freeze(selection) });
    this.notify();
  }

  /**
   * Swaps the whole tree for `root` (a co-editor's tree, a restored revision). Not undoable and not reported through
   * `onChange`; the undo and redo stacks stay, and a step whose block is gone is skipped when it is reached.
   *
   * @throws DocumentInvalidError when `root` is not a well-formed tree.
   */
  replace(root: DocumentNode): void {
    this.commit(parseDocumentNode(root));
  }

  /**
   * What is wrong with the current tree against the registered blocks, by path: `<block id>` →
   * `block_not_registered` for an unknown key, `block_not_allowed` for a block the kind or the kit does not allow,
   * `<block id>.<prop path>` → the schema's issue code for a prop that does not fit; `{}` when nothing is. A path
   * reports its first issue only.
   *
   * @throws TypeError when a registered block's schema is not registered (run `stackra gen`).
   */
  problems(): FieldErrors {
    const errors: Record<string, string> = {};
    const visit = (node: EditorNode): void => {
      const type = this.blocks.get(node.block);
      if (type === undefined) errors[node.id] = "block_not_registered";
      else {
        if (!this.allows(node.block)) errors[node.id] = "block_not_allowed";
        const result = validate(type, node.props);
        if (!result.success)
          for (const issue of result.error.issues)
            errors[[node.id, ...issue.path.map(String)].join(".")] ??= issue.code;
      }
      for (const child of node.children) visit(child);
    };
    visit(this.current.root);
    return errors;
  }

  /** Applies a new local change: it becomes undoable and clears the redo stack. */
  private perform(change: EditorChange): void {
    const { root, inverse } = applyChange(this.current.root, change);
    this.undoStack.push(inverse);
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack.length = 0;
    this.commit(root);
    this.emit(change);
  }

  /** Applies the top change of `from` that still applies and pushes its inverse on `to`. */
  private step(from: EditorChange[], to: EditorChange[]): boolean {
    let skipped = false;
    for (let change = from.pop(); change !== undefined; change = from.pop()) {
      const applied = this.attempt(change);
      if (applied === undefined) {
        skipped = true;
        continue;
      }
      to.push(applied.inverse);
      this.commit(applied.root);
      this.emit(change);
      return true;
    }
    // Skipped steps emptied the stack, which turns `canUndo` or `canRedo` off.
    if (skipped) this.commit(this.current.root);
    return false;
  }

  /** `change` applied to the current tree, or `undefined` when a co-editor removed or moved what it names. */
  private attempt(change: EditorChange): AppliedChange | undefined {
    try {
      return applyChange(this.current.root, change);
    } catch (error) {
      if (isRefusal(error)) return undefined;
      throw error;
    }
  }

  /** Replaces the state with `root`, the selection kept to blocks still in it, and notifies. */
  private commit(root: EditorNode): void {
    const previous = this.current.selection;
    const present = previous.length === 0 ? undefined : blockIds(root);
    const kept = present === undefined ? previous : previous.filter((id) => present.has(id));
    this.current = Object.freeze({
      root,
      selection: kept.length === previous.length ? previous : Object.freeze(kept),
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    });
    this.notify();
  }

  /** Reports a local change. */
  private emit(change: EditorChange): void {
    for (const listener of this.changeListeners) listener(change);
  }

  /** Notifies every state listener. */
  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
