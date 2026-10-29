/**
 * Stackra file contract:
 * Purpose: `ScopeNodeService`, the module service over `ScopeNode`: adds a node under its parent at a level the
 *          declared levels allow, moves a node and its subtree under another parent (re-pathing every node below it
 *          and recording `ScopeMoved` for the other services' rows), and reads the ancestors and descendants of a path
 *          for `PostgresScopeTreeDriver`.
 * Boundary: a `CrudService<ScopeNode>`, so every read and write runs in the caller's transaction and scope session;
 *           row-level security limits both to the session's granted subtrees, and nothing here adds a filter of its
 *           own. The level rule is `childLevelsOf(ScopeConfig.levels, parent.level)`; the label rule is one path label,
 *           and the root's label is `ScopeConfig.root`. Tree depth is a plan entitlement (`ScopeDepthEntitlement`)
 *           that this service does not check. A label already taken under the parent fails on the unique path index,
 *           on add and on move. A move runs in the caller's transaction: the session must see the node and the new
 *           parent, and reach both paths (a grant at a common ancestor), or row-level security refuses the new paths.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 2, 3 and 9); ADR 0411 (subtree move); ADR 0105 as amended by ADR 0294;
 *                     ADR 0160 (raw SQL in a module service method).
 */
import type { ScopeRef } from "@stackra/contracts";
import { CrudService, sql } from "@stackra/database";

import type { ScopeNodeDraft } from "#contracts/index";
import type { ScopeConfig } from "#core/index";
import {
  childLevelsOf,
  isScopePath,
  ScopeLabelInvalidError,
  ScopeLevelInvalidError,
  ScopeMoveInvalidError,
} from "#core/index";
import { ScopeMoved } from "#node/events/scope-moved.event";
import type { ScopeNode } from "#node/models/scope-node.model";

/**
 * Adds and walks scope nodes.
 *
 * @example
 * const root = await nodes.add({ level: "platform", label: "platform", name: "Platform" });
 * await nodes.add({ parent: { id: root.id, path: root.scopePath }, level: "product", label: "acme", name: "Acme" });
 * await nodes.moveSubtree(shop, newOrganisation);
 */
export class ScopeNodeService extends CrudService<ScopeNode> {
  /** The deployment's levels and root. */
  private readonly config: ScopeConfig;

  /**
   * @param config - the deployment's levels and root.
   */
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

  /**
   * Moves `scope` and its subtree under `parent`, keeping its label and every id: the node's path and each path below
   * it take the parent's path in place of the old prefix, in one statement, and the node records `ScopeMoved` so each
   * service re-paths its own rows from its listener. A move to the parent it already has changes nothing.
   * Not named `move`: that is `CrudService.move(id, parentId)`, the `HasTree` re-parent of one row.
   *
   * @throws NotFoundError when the node or the parent is not one the session sees.
   * @throws ScopeMoveInvalidError when the parent is the node itself or below it (the root is above every node).
   * @throws ScopeLevelInvalidError when the node's level cannot sit under the parent.
   */
  async moveSubtree(scope: ScopeRef, parent: ScopeRef): Promise<ScopeNode> {
    const node = await this.findOneOrFail({ id: scope.id });
    const target = await this.findOneOrFail({ id: parent.id });
    const from = node.scopePath;
    if (target.scopePath === from || target.scopePath.startsWith(`${from}.`))
      throw ScopeMoveInvalidError.create({ path: from, parent: target.scopePath });
    const allowed = childLevelsOf(this.config.levels, target.level);
    if (!allowed.includes(node.level))
      throw ScopeLevelInvalidError.create({ level: node.level, allowed });
    const to = `${target.scopePath}.${from.slice(from.lastIndexOf(".") + 1)}`;
    if (to === from) return node;
    await this.repath(from, to);
    // The statement above moved the stored rows; the loaded node takes the same path so its flush carries the event.
    node.scopePath = to;
    node.record(ScopeMoved.create({ scopeId: node.id, from, to }));
    return node;
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
