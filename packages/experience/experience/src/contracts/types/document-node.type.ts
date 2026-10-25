/**
 * Stackra file contract:
 * Purpose: `DocumentNode`, one node of an L2 document: the key of a registered block, the props a tenant or an agent
 *          gave it, the input of the query the block accepts, and its child nodes. A document is one node or a list of
 *          nodes; the experience service stores it, and the builder and collaboration edit it.
 * Boundary: a type only, in the leaf entry, so the builder, collaboration and a server-side validator read the format
 *           without loading a renderer. Data that only references registered code: no markup, CSS, script or
 *           expression, ever (ADR 0110 decision 4, ADR 0154). The renderer checks every node against the registered
 *           blocks before it draws one.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decisions 1, 2, 4 and 6); ADR 0270 (decision 1); ADR 0114 (decision 2); ADR 0154.
 */
import type { Json } from "@stackra/contracts";

/**
 * A node of a document tree.
 *
 * @example
 * const node: DocumentNode = {
 *   block: "web.testimonials",
 *   props: { title: { en: "What customers say", ar: "ماذا يقول عملاؤنا" }, limit: 3 },
 *   input: { type: "testimonial" },
 * };
 */
export interface DocumentNode {
  /** The registered block's key (`web.hero_section`); a key renamed with `@Renamed` still resolves. */
  readonly block: string;

  /** The block's props as stored, checked against the block's generated schema on render; `{}` when absent. */
  readonly props?: Readonly<Record<string, Json>>;

  /** The input of the query the block `accepts`; `{}` when absent, ignored by a block that accepts none. */
  readonly input?: Json;

  /** Nested nodes, drawn in order as the block's `children`. */
  readonly children?: readonly DocumentNode[];
}
