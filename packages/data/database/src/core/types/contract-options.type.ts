/**
 * Stackra file contract:
 * Purpose: `ContractOptions`, what a contract step (a dropped column or table, a finished rename) states: the migration
 *          of the earlier release that made it safe, so `stackra db migrate` refuses it while that release has not
 *          shipped before this one.
 * Boundary: a type only; `after` is a literal migration id (the frozen snapshot rule), checked when the step is
 *           recorded, and becomes one of the migration's `after` edges too, so gen orders the two and refuses an id no
 *           loaded migration has.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: expand and contract, destructive steps deferred to a later release).
 */

/** The release a contract step waits for. */
export interface ContractOptions {
  /**
   * The migration that shipped in an earlier release and made this step safe: the one that stopped the code from
   * using what this step removes (`"orders.0007_stop_writing_note"`), or the expand step of a rename. It must have
   * been applied by an earlier `stackra db migrate` run than the one applying this step. A typed id from
   * `#stackra/migrations` or the same literal.
   */
  readonly after: string;
}
