/**
 * Stackra file contract:
 * Purpose: `RichTextNode`, one node of a rich-text document in its stored form: ProseMirror JSON, the shape TipTap's
 *          `getJSON()` returns and `setContent()` takes.
 * Boundary: types only; the schema (which `type`s and `marks` exist) belongs to `@stackra/builder` (ADR 0466 decision
 *           2), so this names the JSON shape and nothing more.
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decisions 2 and 7); ADR 0110 (L2 document JSON); STA-1371.
 */

/** A rich-text document node: the root is `{ type: "doc", content: [...] }`. */
export interface RichTextNode {
  /** The node or mark name, such as `doc`, `paragraph`, `heading` or `text`. */
  readonly type: string;
  /** The node's attributes, such as a heading's `level`. */
  readonly attrs?: Readonly<Record<string, unknown>> | undefined;
  /** The child nodes. */
  readonly content?: readonly RichTextNode[] | undefined;
  /** The marks on a text node, such as `bold` or `link`. */
  readonly marks?:
    | readonly {
        readonly type: string;
        readonly attrs?: Readonly<Record<string, unknown>> | undefined;
      }[]
    | undefined;
  /** The text of a `text` node. */
  readonly text?: string | undefined;
}
