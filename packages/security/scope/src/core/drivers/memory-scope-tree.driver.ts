/**
 * Stackra file contract:
 * Purpose: `MemoryScopeTreeDriver`, the in-process `ScopeTree`: the entries it was built with, read by id, by path and
 *          along the path for ancestors and descendants. The driver of tests, local runs and a client that already
 *          holds the nodes it may see.
 * Boundary: holds a copy of the entries and never changes it; what a caller may see is what it was given (the Postgres
 *           driver leaves that to row-level security). Ancestors come root first and descendants in path order, as the
 *           port states.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 1 and 3); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { ScopeTree } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import { isWithinScope } from "#core/functions/is-within-scope.function";

/** Orders entries by path, so a prefix comes before what sits below it. */
const byPathOrder = (a: ScopeEntry, b: ScopeEntry): number =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

/**
 * A tree over a fixed list.
 *
 * @example
 * const tree = new MemoryScopeTreeDriver([
 *   { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform", level: "platform", name: "Platform" },
 * ]);
 */
export class MemoryScopeTreeDriver extends Driver(ScopeTree) {
  /** The entries, in path order. */
  private readonly entries: readonly ScopeEntry[];

  /** @param entries - the nodes this tree holds. */
  constructor(entries: readonly ScopeEntry[]) {
    super();
    this.entries = [...entries].sort(byPathOrder);
  }

  /** See `ScopeTree.node`. */
  async node(id: PublicId<"scp">): Promise<ScopeEntry | undefined> {
    return this.entries.find((entry) => entry.id === id);
  }

  /** See `ScopeTree.byPath`. */
  async byPath(path: string): Promise<ScopeEntry | undefined> {
    return this.entries.find((entry) => entry.path === path);
  }

  /** See `ScopeTree.ancestors`. */
  async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return this.entries.filter(
      (entry) => entry.path !== scope.path && isWithinScope(scope.path, entry.path),
    );
  }

  /** See `ScopeTree.descendants`. */
  async descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return this.entries.filter(
      (entry) => entry.path !== scope.path && isWithinScope(entry.path, scope.path),
    );
  }
}
