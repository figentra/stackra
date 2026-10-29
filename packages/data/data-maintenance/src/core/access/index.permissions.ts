/**
 * Stackra file contract:
 * Purpose: `IndexPermissions`, the permissions of the `index` maintenance jobs: `data_maintenance.index.<verb>`.
 *          `reindex` and `reindexSemantic` are what `ReindexSearchAction` (`index.reindex`) and `ReindexSemanticAction`
 *          (`index.reindex_semantic`) derive, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. System-held: the job runs as the system actor and no role may grant it. This
 *           add-on sits above @stackra/iam and @stackra/search, so it imports `Permissions` from iam; neither depends
 *           on it (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1); ADR
 *                     0404 (decision 3); ADR 0221 (decision 7).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `IndexPermissions.reindex`.
 *
 * @example
 * export class ReindexSearchAction extends Action({ key: "index.reindex", actors: [ActorKind.System] }) {}
 */
export class IndexPermissions extends Permissions {
  /** Rebuild a full-text index; a reversible write, held only by the platform. */
  static readonly reindex = Permission.L2.system();

  /** Backfill vector passages through the embedder; a reversible write, held only by the platform. */
  static readonly reindexSemantic = Permission.L2.system();
}
