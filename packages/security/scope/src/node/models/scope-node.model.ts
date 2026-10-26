/**
 * Stackra file contract:
 * Purpose: `ScopeNode`, one node of the scope tree as persisted: its public id (`scp_…`, the scope id other tables
 *          carry as `scope_id`), the key of its level, its materialised path and its display name.
 * Boundary: data and indexes. Key `scope.scope_node`, table `scope.scope_nodes` (the package's Postgres schema). The
 *           path is the tree: a node's ancestors are the prefixes of its path and its descendants the paths below it,
 *           so there is no parent column. The level is text, never an enum column, so a level added to
 *           `ScopeConfig.levels` needs no migration (ADR 0327 d2). Nodes are added through `ScopeNodeService.add`,
 *           never with `new`; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 2 and 3); ADR 0240 (decision 5); ADR 0294 (decisions 4, 11, 20 and 27); ADR
 *                     0135 (public ids).
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/**
 * A node of the scope tree. Traits add `id` and the timestamps. The path's GiST and unique indexes are the migration's:
 * an `@Index(["scopePath"])` would take the name of the GiST index `t.scopePath()` writes, until @stackra/database names
 * the two apart.
 */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ScopeNode extends Model.with(HasPublicId("scp"), Timestamps) {
  /** The key of the level the node sits at, one of `ScopeConfig.levels`. */
  level!: string;

  /** The node's materialised `ltree` path, root first (`platform.acme`); unique, with a GiST index. */
  scopePath!: string;

  /** The node's display name. */
  name!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
/** Marks the `ScopeNode` fields the model fills itself (`[OptionalProps]`). */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ScopeNode {
  /** The fields an insert may leave out: the trait timestamps. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
