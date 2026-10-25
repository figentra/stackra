/**
 * Stackra file contract:
 * Purpose: `EditorChange`, one edit of a document as data: what `Editor` applies, what its undo and redo stacks hold
 *          and what it reports to a binding that mirrors local edits into a shared document.
 * Boundary: a type only, in the leaf entry. A change names blocks by id. An index is a position in the parent's
 *           children after the moved block was taken out, clamped to the list. A `SetProp` with `value: undefined`
 *           clears the prop.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the undo and redo command stack, the co-edit binding).
 */
import type { Json } from "@stackra/contracts";

import type { EditorChangeKind } from "#contracts/enums/editor-change-kind.enum";
import type { EditorNode } from "#contracts/types/editor-node.type";

/**
 * One document edit.
 *
 * @example
 * const change: EditorChange = { kind: EditorChangeKind.SetProp, id: hero.id, name: "title", value: "Hi" };
 */
export type EditorChange =
  | {
      readonly kind: typeof EditorChangeKind.Insert;
      /** The block the new one goes under. */
      readonly parentId: string;
      /** Its position among the parent's children. */
      readonly index: number;
      /** The block, with the blocks nested in it. */
      readonly node: EditorNode;
    }
  | {
      readonly kind: typeof EditorChangeKind.Remove;
      /** The block taken out, with everything nested in it. */
      readonly id: string;
    }
  | {
      readonly kind: typeof EditorChangeKind.Move;
      /** The block moved. */
      readonly id: string;
      /** Its new parent; the same parent reorders. */
      readonly parentId: string;
      /** Its position among the new parent's children. */
      readonly index: number;
    }
  | {
      readonly kind: typeof EditorChangeKind.SetProp;
      /** The block whose prop changes. */
      readonly id: string;
      /** The prop's name. */
      readonly name: string;
      /** The new value, or `undefined` to clear the prop. */
      readonly value: Json | undefined;
    };
