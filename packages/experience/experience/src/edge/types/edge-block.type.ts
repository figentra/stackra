/**
 * Stackra file contract:
 * Purpose: `EdgeBlock`, one OS-registered block the edge Worker draws to HTML: its key, its block class (whose
 *          generated schema checks the node's props) and the function that writes its HTML from the parsed,
 *          localised props and its children's HTML.
 * Boundary: a type only. The OS landing block package supplies these and the OS Worker passes them; a product's own
 *           block is never an `EdgeBlock`, so no product code runs in the Worker (ADR 0440, review point 1). `html`
 *           returns markup: it escapes every prop it writes with `escapeHtml` and inserts `children` as given.
 * Runtime: isomorphic
 * Governing contract: ADR 0440; ADR 0437 (the edge Worker); ADR 0110 (decision 4: documents are data).
 */
import type { BlockClass } from "#core/types/block-class.type";
import type { EdgeBlockContext } from "#edge/types/edge-block-context.type";

/** A block the edge renders to HTML. */
export interface EdgeBlock {
  /** The block's key (`landing.hero_section`); a `@Renamed` old key on the class still resolves. */
  readonly key: string;

  /** The block class: its generated schema parses the node's props. */
  readonly block: BlockClass;

  /**
   * The block's HTML. Pure and synchronous: no fetch, no Node API, no global state.
   *
   * @param props - the parsed props, defaults applied, `LocalizedText` read in the locale. Untrusted text: escape it.
   * @param children - the HTML of the node's children, already rendered and safe to insert.
   */
  readonly html: (
    props: Readonly<Record<string, unknown>>,
    children: string,
    context: EdgeBlockContext,
  ) => string;
}
