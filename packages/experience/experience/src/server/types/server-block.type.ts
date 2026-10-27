/**
 * Stackra file contract:
 * Purpose: `ServerBlock`, one block the node renderer draws to HTML: its key, its block class (whose generated schema
 *          checks the node's props and whose `kinds` say which documents it fits) and the function that writes its
 *          HTML from the parsed, localised props, its children's HTML and the render's data.
 * Boundary: a type only. The host passes the whole set; a node naming any other key is refused, never a placeholder
 *           (an email or a PDF has no browser to hydrate it). `html` escapes every prop and data value it writes with
 *           `escapeHtml` and inserts `children` as given. An email block writes inline styles only.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 6 and 7: email-safe blocks, the node renderer); ADR 0110 (decision 4).
 */
import type { BlockClass } from "#core/types/block-class.type";
import type { ServerBlockContext } from "#server/types/server-block-context.type";

/** A block the node renderer draws to HTML. */
export interface ServerBlock {
  /** The block's key (`mail.order_lines`); a `@Renamed` old key on the class still resolves. */
  readonly key: string;

  /** The block class: its generated schema parses the node's props, its `kinds` gate the document kind. */
  readonly block: BlockClass;

  /**
   * The block's HTML. Pure and synchronous: no fetch, no global state.
   *
   * @param props - the parsed props, defaults applied, `LocalizedText` read in the locale. Untrusted text: escape it.
   * @param children - the HTML of the node's children, already rendered and safe to insert.
   */
  readonly html: (
    props: Readonly<Record<string, unknown>>,
    children: string,
    context: ServerBlockContext,
  ) => string;
}
