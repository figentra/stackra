/**
 * Stackra file contract:
 * Purpose: `LoginPolicyPermissions`, the permissions of an organisation's login policy: `identity.login_policy.<verb>`,
 *          each with its risk. `read` is what `ShowLoginPolicyQuery` derives (the security settings screen shows the
 *          sign-in rules), `set` what `SetLoginPolicyAction` derives (forcing a second factor, choosing the methods,
 *          second factors and external providers), so gen's `permission_unknown` passes.
 * Boundary: statics only; the value is the risk and nothing else. Keys are derived from the module, the class (minus
 *           `Permissions`) and the static. Declared here, above @stackra/iam, as ADR 0462 asks of a package with its
 *           own actions. Setting the policy changes how every person of the tenant signs in and can lock them out, so
 *           it is L3 (with a step-up on the action); reading it reveals no personal data, so L1. A product grants
 *           `set` at the tenant's root to its owner and administrator roles.
 * Runtime: isomorphic
 * Governing contract: ADR 0462; ADR 0294 (decisions 16 and 20); ADR 0099 (risk); ADR 0207 (decision 1); STA-2817.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The login policy verbs.
 *
 * @example
 * export class SetLoginPolicyAction extends Action({ key: "login_policy.set", stepUp: AssuranceLevel.Aal2 }) {}
 */
export class LoginPolicyPermissions extends Permissions {
  /** Read the tenant's login policy; L1. */
  static readonly read = Permission.L1;

  /** Set the tenant's login policy (force MFA, the methods, factors and providers); L3. */
  static readonly set = Permission.L3;
}
