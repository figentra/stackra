/**
 * Stackra file contract:
 * Purpose: `AutomationPermissions`, the verbs on a workflow automation this package's own actions declare:
 *          `start_triggered`, the queued start of the automations one trigger occurrence starts (L2).
 * Boundary: a Permissions class; gen derives `workflow.automation.start_triggered` from the class and the static. Only
 *           the system and job actors run it (the trigger listener pushes it); no person or agent holds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (permission names); ADR 0122 (decision 3).
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * The automation verbs.
 *
 * @example
 * export class StartTriggeredAutomationsAction extends Action({ key: "automation.start_triggered", ... }) {}
 */
export class AutomationPermissions extends Permissions {
  /** Start the automations one trigger occurrence starts, as a queued job; L2. */
  static readonly start_triggered = Permission.L2;
}
