/**
 * Stackra file contract:
 * Purpose: `GraphFlow`, one business flow declared once in a repo's `stackra.flows.json` (payment, refund, sign-in,
 *          ...): its id, title and ordered steps between nodes, actors and providers, each a call or an event.
 * Boundary: a type only. Authored as configuration in `stackra.flows.json` at the repo root, never in code. A step
 *           names node ids (`os.billing`), or `actor.<key>` and `provider.<key>` which are not gen nodes; a reference
 *           no node answers is a gap of the graph, not a refusal, because a flow crosses repos.
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decision 3: flows declared once); STA-845 (level 2 of the map).
 */

/** One declared flow. */
export interface GraphFlow {
  /** The flow id, kebab-case and unique across the system (`checkout-platform`). */
  readonly id: string;

  /** The title the map shows. */
  readonly title: string;

  /** One or two sentences on what happens. */
  readonly summary?: string;

  /** The steps, in order. */
  readonly steps: readonly {
    /** A node id, `actor.<key>` or `provider.<key>`. */
    readonly from: string;
    /** A node id, `actor.<key>` or `provider.<key>`. */
    readonly to: string;
    /** `call` or `event`. */
    readonly kind: string;
    /** What the step does, in words. */
    readonly label: string;
    /** The event wire name, for an `event` step. */
    readonly event?: string;
    /** The data that moves, in words. */
    readonly data?: string;
  }[];
}
