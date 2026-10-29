/**
 * Stackra file contract:
 * Purpose: `SessionPermissions`, the permissions of the identity provider sessions: `identity.session.<verb>`, each
 *          with its risk. `list`, `end` and `end_all` are what the signed-in user's own session calls derive (the
 *          security page's "where you are signed in" and "sign out everywhere"), `end_user` what the admin's
 *          sign-out-everywhere for another user derives, so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Declared here, above @stackra/iam, as ADR 0462 asks of a package with its
 *           own actions: iam keeps the `Permissions` base and knows nothing of identity. Ending a session takes access
 *           away and is undone by signing in again, so one's own are L2; another user's L3.
 * Runtime: isomorphic
 * Governing contract: ADR 0462; ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-1580.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The session verbs.
 *
 * @example
 * export class EndMySessionAction extends Action({ key: "session.end", actors: [ActorKind.User] }) {}
 */
export class SessionPermissions extends Permissions {
  /** List one's own live sessions; L1. */
  static readonly list = Permission.L1;

  /** End one of one's own sessions; L2. */
  static readonly end = Permission.L2;

  /** End every one of one's own sessions ("sign out everywhere"); L2. */
  static readonly endAll = Permission.L2;

  /** End every session of another user (an administrator's "sign out everywhere"); L3, as it acts on someone else. */
  static readonly endUser = Permission.L3;
}
