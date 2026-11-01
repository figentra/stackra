/**
 * Stackra file contract:
 * Purpose: `ArchitectureInputs`, what the architecture map is drawn from: each member's place (tier, category,
 *          runtimes) and the client call edges between member packages.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0003 (tiers); ADR 0452 (system graph); STA-1373.
 */

/** The inputs of `renderArchitectureMap`. */
export type ArchitectureInputs = {
  /** Every workspace member with its place. */
  readonly members: readonly {
    /** The member folder, repository-relative. */
    readonly dir: string;
    /** The npm name. */
    readonly name: string;
    /** The tier without `tier:`, `untiered` when neither the stackra field nor the tags name one. */
    readonly tier: string;
    /** The category, when the stackra field or the tags name one. */
    readonly category: string | undefined;
    /** The runtimes of both sources, sorted. */
    readonly runtimes: readonly string[];
  }[];

  /** The client call edges of `stackra.graph.json`, as package names (undefined outside this workspace). */
  readonly calls: readonly {
    /** The calling package. */
    readonly from: string | undefined;
    /** The called package. */
    readonly to: string | undefined;
  }[];
};
