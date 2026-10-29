/**
 * Stackra file contract:
 * Purpose: `OperatorPermissions`, the permission of the operator bootstrap: `identity.operator.bootstrap`, what
 *          `BootstrapOperatorAction` derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Declared here, above @stackra/iam, as ADR 0462 asks
 *           of a package with its own actions. System-held: the decision point lets only a service principal acting
 *           for no one hold it (the environment's bootstrap credential), and no role ever grants it, so a user, an
 *           operator included, can never call the bootstrap.
 * Runtime: isomorphic
 * Governing contract: ADR 0462; ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-1586.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The operator bootstrap verb.
 *
 * @example
 * export class BootstrapOperatorAction extends Action({ key: "operator.bootstrap", actors: [ActorKind.Service] }) {}
 */
export class OperatorPermissions extends Permissions {
  /** Give a user a role at the platform node; L4, as it hands out the platform, held only by the platform. */
  static readonly bootstrap = Permission.L4.system();
}
