/**
 * Stackra file contract:
 * Purpose: `EditorNode`, one block instance of an open document: experience's `DocumentNode` with an id, and with its
 *          props and children always present.
 * Boundary: a type only, in the leaf entry. It is a `DocumentNode`, so an editor's tree is the experience document
 *           as it stands, with no conversion. The id is unique in the document and stable across edits, so selection,
 *           undo and co-editing name a block by it; a stored node without one gets an id derived from its position
 *           when the document is parsed. The query `input` is kept as loaded: the editor never changes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1 and 4); ADR 0110 (L2 documents); ADR 0154 (data that names registered
 *                     code only).
 */
import type { Json } from "@stackra/contracts";
import type { DocumentNode } from "@stackra/experience/contracts";

/**
 * One block in an editor's tree.
 *
 * @example
 * const root: EditorNode = {
 *   id: "0b6f0c52-6d0f-4f8e-9a51-3f4f1f0e2c11",
 *   block: "web.hero_section",
 *   props: { title: { "en-US": "Summer camp" } },
 *   children: [],
 * };
 */
export interface EditorNode extends DocumentNode {
  /** Unique in the document: 1 to 64 of `A-Z`, `a-z`, `0-9`, `_` and `-` (a UUID fits). */
  readonly id: string;

  /** The props passed to the block, checked against its schema by `Editor.problems`. */
  readonly props: Readonly<Record<string, Json>>;

  /** The blocks nested in this one, in order. */
  readonly children: readonly EditorNode[];
}
