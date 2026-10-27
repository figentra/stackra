/**
 * Stackra file contract:
 * Purpose: `SegmentPermissions`, the permissions of the segment model: `segments.segment.<verb>`, each with its risk.
 *          `recompute` is what `RecomputeSegmentsAction` (`segment.recompute`) derives, so gen's `permission_unknown`
 *          passes (STA-1365 item 9).
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Segments is an add-on above @stackra/iam and @stackra/rules, so it imports
 *           `Permissions` from iam; iam never imports segments (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); ADR 0462 (decision 1).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `SegmentPermissions.recompute`.
 *
 * @example
 * export class RecomputeSegmentsAction extends Action({ key: "segment.recompute", actors: [ActorKind.Job] }) {}
 */
export class SegmentPermissions extends Permissions {
  /** Recompute segment membership; the hourly job runs it, so it is held only by the platform. */
  static readonly recompute = Permission.L1.system();
}
