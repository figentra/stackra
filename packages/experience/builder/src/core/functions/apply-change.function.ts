/**
 * Stackra file contract:
 * Purpose: `applyChange(root, change)`, the one place a document tree changes: it applies an insert, remove, move or
 *          set-prop change and returns the new tree with the change that reverts it.
 * Boundary: a pure function over frozen trees: the input is never mutated, untouched subtrees are shared and every new
 *           node is frozen. Indexes are clamped to the parent's children. A change that names a missing block, moves
 *           or removes the root, moves a block into itself or reuses an id is refused before anything changes.
 *           Internal to the core entry: `Editor` is the public way to change a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the undo and redo command stack, drag and drop).
 */
import type { Json } from "@stackra/contracts";

import { type EditorNode, type EditorChange, EditorChangeKind } from "#contracts/index";
import { BlockMoveInvalidError } from "#core/errors/block-move-invalid.error";
import { BlockNotFoundError } from "#core/errors/block-not-found.error";
import { DocumentInvalidError } from "#core/errors/document-invalid.error";
import { RootBlockLockedError } from "#core/errors/root-block-locked.error";
import { blockIds } from "#core/functions/block-ids.function";
import type { AppliedChange } from "#core/types/applied-change.type";

/** Where a block sits: the block, its parent (none for the root) and its position there. */
interface Location {
  readonly node: EditorNode;
  readonly parent: EditorNode | undefined;
  readonly index: number;
}

/** The block `id` under `root` (`root` included), or `undefined`. */
function locate(root: EditorNode, id: string): Location | undefined {
  if (root.id === id) return { node: root, parent: undefined, index: 0 };
  for (const [index, child] of root.children.entries()) {
    const found = child.id === id ? { node: child, parent: root, index } : locate(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * The block `id` under `root`.
 *
 * @throws BlockNotFoundError when there is none.
 */
function mustLocate(root: EditorNode, id: string): Location {
  const found = locate(root, id);
  if (found === undefined) throw BlockNotFoundError.create({ id });
  return found;
}

/** `node` with `children`, frozen. */
function withChildren(node: EditorNode, children: readonly EditorNode[]): EditorNode {
  return Object.freeze({ ...node, children: Object.freeze([...children]) });
}

/** `root` with the block `id` swapped for `next`, copying only the path to it. */
function swap(root: EditorNode, id: string, next: EditorNode): EditorNode {
  if (root.id === id) return next;
  const children = root.children.map((child) => swap(child, id, next));
  return children.every((child, index) => child === root.children[index])
    ? root
    : withChildren(root, children);
}

/** `index` as a whole position in a list of `length` items: 0 to `length`. */
function clamp(index: number, length: number): number {
  return Math.min(Math.max(Math.trunc(index) || 0, 0), length);
}

/** `list` with `item` placed at `index` (clamped). */
function placed(
  list: readonly EditorNode[],
  index: number,
  item: EditorNode,
): readonly EditorNode[] {
  const at = clamp(index, list.length);
  return [...list.slice(0, at), item, ...list.slice(at)];
}

/**
 * `change` applied to `root`.
 *
 * @throws BlockNotFoundError when the change names a block or parent `root` does not hold.
 * @throws RootBlockLockedError when it moves or removes the root.
 * @throws BlockMoveInvalidError when it moves a block into itself or a block nested in it.
 * @throws DocumentInvalidError when an inserted block reuses an id of the tree (`id_taken`).
 * @example
 * const { root: next, inverse } = applyChange(root, { kind: EditorChangeKind.Remove, id: hero.id });
 * applyChange(next, inverse).root; // the tree before, hero back in place
 */
export function applyChange(root: EditorNode, change: EditorChange): AppliedChange {
  switch (change.kind) {
    case EditorChangeKind.Insert: {
      const parent = mustLocate(root, change.parentId).node;
      const taken = blockIds(root);
      for (const id of blockIds(change.node))
        if (taken.has(id))
          throw DocumentInvalidError.create({}, { fieldErrors: { [id]: "id_taken" } });
      return {
        root: swap(
          root,
          parent.id,
          withChildren(parent, placed(parent.children, change.index, change.node)),
        ),
        inverse: { kind: EditorChangeKind.Remove, id: change.node.id },
      };
    }
    case EditorChangeKind.Remove: {
      const { node, parent, index } = mustLocate(root, change.id);
      if (parent === undefined) throw RootBlockLockedError.create();
      return {
        root: swap(
          root,
          parent.id,
          withChildren(
            parent,
            parent.children.filter((_, at) => at !== index),
          ),
        ),
        inverse: { kind: EditorChangeKind.Insert, parentId: parent.id, index, node },
      };
    }
    case EditorChangeKind.Move: {
      const { node, parent: from, index } = mustLocate(root, change.id);
      if (from === undefined) throw RootBlockLockedError.create();
      mustLocate(root, change.parentId);
      if (locate(node, change.parentId) !== undefined)
        throw BlockMoveInvalidError.create({ id: change.id, parentId: change.parentId });
      const detached = swap(
        root,
        from.id,
        withChildren(
          from,
          from.children.filter((_, at) => at !== index),
        ),
      );
      // Read the target again: it is `from` itself when the block only changes position.
      const target = mustLocate(detached, change.parentId).node;
      return {
        root: swap(
          detached,
          target.id,
          withChildren(target, placed(target.children, change.index, node)),
        ),
        inverse: { kind: EditorChangeKind.Move, id: change.id, parentId: from.id, index },
      };
    }
    case EditorChangeKind.SetProp: {
      const { node } = mustLocate(root, change.id);
      const previous: Json | undefined = Object.hasOwn(node.props, change.name)
        ? node.props[change.name]
        : undefined;
      const kept = Object.entries(node.props).filter(([name]) => name !== change.name);
      const props = Object.freeze(
        Object.fromEntries(
          change.value === undefined ? kept : [...kept, [change.name, change.value]],
        ),
      );
      return {
        root: swap(root, node.id, Object.freeze({ ...node, props })),
        inverse: {
          kind: EditorChangeKind.SetProp,
          id: change.id,
          name: change.name,
          value: previous,
        },
      };
    }
  }
}
