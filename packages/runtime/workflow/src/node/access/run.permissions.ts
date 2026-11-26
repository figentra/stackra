/**
 * Stackra file contract:
 * Purpose: `RunPermissions`, the verbs on a workflow run: `get`, reading a run's status and safe output (L1).
 * Boundary: a Permissions class; gen derives `workflow.run.get` from the class and the static.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (permission names); STA-2613.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The run verbs.
 *
 * @example
 * export class GetRunQuery extends Query({ key: "run.get", actors: [ActorKind.User] }) {}
 */
export class RunPermissions extends Permissions {
  /** Read a run's status and its workflow's output; L1. */
  static readonly get = Permission.L1;
}
