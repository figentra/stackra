/**
 * Stackra file contract:
 * Purpose: `DraftRecord<F, N>`, the base of every chainable builder step: it keeps the step's flags, replaces them on each
 *          chained call and builds the node from them when gen asks.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. Each call returns the same step, so a member reads as one chain; nothing
 *           is built until `toNode()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5: builders are pure).
 */

/** A chainable step that records flags `F` and builds node `N`. */
export class DraftRecord<F extends object, N> {
  /** The flags recorded so far. */
  private flags: F;

  /** Builds the node from the flags. */
  private readonly build: (flags: F) => N;

  /**
   * @param build - turns the recorded flags into the node.
   * @param flags - the flags the step starts with.
   */
  constructor(build: (flags: F) => N, flags: F) {
    this.build = build;
    this.flags = flags;
  }

  /** The node built from the flags recorded so far. */
  toNode(): N {
    return this.build(this.flags);
  }

  /** Records `patch` over the flags and returns the same step. */
  protected set(patch: Partial<F>): this {
    this.flags = { ...this.flags, ...patch };
    return this;
  }
}
