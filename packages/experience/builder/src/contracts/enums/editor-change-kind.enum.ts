/**
 * Stackra file contract:
 * Purpose: `EditorChangeKind`, the four edits every builder surface is made of: insert a block, remove it, move it,
 *          set one of its props.
 * Boundary: an enum in the leaf entry; the discriminant of `EditorChange`. Selection is not a change: it is never
 *           undone and never shared.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: one undo and redo command stack); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kinds of document change.
 *
 * @example
 * if (change.kind === EditorChangeKind.SetProp) inspector.refresh(change.id);
 */
export const EditorChangeKind = Enum.of({
  /** A block (with the blocks nested in it) placed under a parent. */
  Insert: "insert",
  /** A block and everything nested in it taken out. */
  Remove: "remove",
  /** A block placed under another parent or at another position. */
  Move: "move",
  /** One prop of a block set or cleared. */
  SetProp: "set_prop",
});

/** One of the codes above. */
export type EditorChangeKind = Enum.Value<typeof EditorChangeKind>;
