/**
 * Stackra file contract:
 * Purpose: `PingPermissions`, the permissions of the ping query: `health.ping.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk. Keys and labels are derived from the module, the class (minus
 *           `Permissions`) and the static; `ping.check` takes `read`. The platform actor passes every check, so this
 *           grants nothing to a person.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0208 (names); ADR 0099 (risk).
 */
import { Permission, Permissions } from "@stackra/iam";

/** Read by `PingQuery`. */
export class PingPermissions extends Permissions {
  /** Run the pipeline probe. */
  static readonly read = Permission.L0;
}
