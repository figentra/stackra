/**
 * Stackra file contract:
 * Purpose: `PostgresScopeTreeDriver`, the server's `ScopeTree`: reads `scope.scope_nodes` through `ScopeNodeService`
 *          and hands each row on as a `ScopeEntry`.
 * Boundary: reads only, in the caller's transaction and scope session, so row-level security shows the nodes of the
 *           session's granted subtrees and nothing else; outside every scope session it sees no node. It adds no
 *           filter of its own (ADR 0327 d9).
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 1, 3 and 9); ADR 0142 (drivers behind a port); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { ScopeTree } from "#contracts/index";
import type { ScopeEntry } from "#contracts/index";
import type { ScopeNode } from "#node/models/scope-node.model";
import { ScopeNodeService } from "#node/services/scope-node.service";

/** The entry of one row. */
const entryOf = (node: ScopeNode): ScopeEntry => ({
  id: node.id,
  path: node.scopePath,
  level: node.level,
  name: node.name,
});

/**
 * The tree over the node table.
 *
 * @example
 * await database.withScope(granted, () => tree.descendants(scope));
 */
export class PostgresScopeTreeDriver extends Driver(ScopeTree) {
  /** The node table's service. */
  private readonly nodes: ScopeNodeService;

  /** @param nodes - the node table's service. */
  constructor(nodes: ScopeNodeService) {
    super();
    this.nodes = nodes;
  }

  /** See `ScopeTree.node`. */
  async node(id: PublicId<"scp">): Promise<ScopeEntry | undefined> {
    const node = await this.nodes.findOne({ id });
    return node === null ? undefined : entryOf(node);
  }

  /** See `ScopeTree.byPath`. */
  async byPath(path: string): Promise<ScopeEntry | undefined> {
    const node = await this.nodes.findOne({ scopePath: path });
    return node === null ? undefined : entryOf(node);
  }

  /** See `ScopeTree.ancestors`. */
  async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (await this.nodes.ancestorsOf(scope)).map(entryOf);
  }

  /** See `ScopeTree.descendants`. */
  async descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (await this.nodes.descendantsOf(scope)).map(entryOf);
  }
}
