/**
 * Stackra file contract:
 * Purpose: `ScopeNodeService`, the module service over `ScopeNode`: adds a node under its parent at a level the
 *          declared levels allow, and reads the ancestors and descendants of a path for `PostgresScopeTreeDriver`.
 * Boundary: a `CrudService<ScopeNode>`, so every read and write runs in the caller's transaction and scope session;
 *           row-level security limits both to the session's granted subtrees, and nothing here adds a filter of its
 *           own. The level rule is `childLevelsOf(ScopeConfig.levels, parent.level)`; the label rule is one path label,
 *           and the root's label is `ScopeConfig.root`. Tree depth is a plan entitlement (`ScopeDepthEntitlement`)
 *           that this service does not check. A label already taken under the parent fails on the unique path index.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 2, 3 and 9); ADR 0105 as amended by ADR 0294; ADR 0160 (raw SQL in a
 *                     module service method).
 */
import type { ScopeRef } from "@stackra/contracts";
import { CrudService, sql } from "@stackra/database";

import type { ScopeNodeDraft } from "#contracts/index";
import {
  childLevelsOf,
  isScopePath,
  ScopeConfig,
  ScopeLabelInvalidError,
  ScopeLevelInvalidError,
} from "#core/index";
import type { ScopeNode } from "#node/models/scope-node.model";

/**
 * Adds and walks scope nodes.
 *
 * @example
 * const root = await nodes.add({ level: "platform", label: "platform", name: "Platform" });
 * await nodes.add({ parent: { id: root.id, path: root.scopePath }, level: "product", label: "acme", name: "Acme" });
 */
export class ScopeNodeService extends CrudService<ScopeNode> {
  /** The deployment's levels and root. */
  private readonly config: ScopeConfig;

  /** @param config - the deployment's levels and root. */
  constructor(config: ScopeConfig) {
    super();
    this.config = config;
  }

  /**
   * Stores a node under `draft.parent` (the root when absent) at `draft.level`, its path the parent's and the label.
   *
   * @throws ScopeLabelInvalidError when the label is not one path label, or a root's label is not `ScopeConfig.root`.
   * @throws NotFoundError when the parent is not a node the session sees.
   * @throws ScopeLevelInvalidError when the level cannot sit under the parent.
   */
  async add(draft: ScopeNodeDraft): Promise<ScopeNode> {
    const { label, level, name } = draft;
    const isRoot = draft.parent === undefined;
    if (!isScopePath(label) || label.includes(".") || (isRoot && label !== this.config.root))
      throw ScopeLabelInvalidError.create({ label });
    const parent =
      draft.parent === undefined ? undefined : await this.findOneOrFail({ id: draft.parent.id });
    const allowed = childLevelsOf(this.config.levels, parent?.level);
    if (!allowed.includes(level)) throw ScopeLevelInvalidError.create({ level, allowed });
    const scopePath = parent === undefined ? label : `${parent.scopePath}.${label}`;
    return this.insert({ level, name, scopePath });
  }

  /** The nodes above `scope` the session sees, root first. */
  ancestorsOf(scope: ScopeRef): Promise<ScopeNode[]> {
    // raw-sql: the ltree ancestor operator `@>` has no typed filter
    return this.find(
      { $raw: sql`scope_path @> ${scope.path}::ltree and scope_path <> ${scope.path}::ltree` },
      { orderBy: { scopePath: "asc" } },
    );
  }

  /** The nodes below `scope` the session sees, in path order. */
  descendantsOf(scope: ScopeRef): Promise<ScopeNode[]> {
    // raw-sql: the ltree descendant operator `<@` has no typed filter; it uses the GiST index on scope_path
    return this.find(
      { $raw: sql`scope_path <@ ${scope.path}::ltree and scope_path <> ${scope.path}::ltree` },
      { orderBy: { scopePath: "asc" } },
    );
  }
}
