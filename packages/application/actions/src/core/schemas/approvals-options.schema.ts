/**
 * Stackra file contract:
 * Purpose: `ApprovalsOptions`, the shape of `ApprovalsConfig`: `storeService`, the member of the service that runs the
 *          approval store (OS tasks-approvals), whose verified `approval.granted` envelopes alone the executor acts on.
 * Boundary: a shape class; it registers this package's own schema (`APPROVALS_CONFIG_SCHEMA`) for itself when the
 *           module loads. The default is empty, which trusts no delivery (fail closed). It is compared with
 *           `ctx.producer`, the producer the transport verified, never with a field of the event.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (decision 7: envelopes from the store's service only); ADR 0294 (decisions 19 and 26);
 *                     STA-1724 FR-011; STA-1792.
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { APPROVALS_CONFIG_SCHEMA } from "#core/constants/approvals-config-schema.constant";

/**
 * The approval executor's settings.
 *
 * @example
 * export class ApprovalsConfig extends BaseApprovalsConfig {
 *   override storeService = "tasks";
 * }
 */
export class ApprovalsOptions extends Schema {
  /** The member of the approval store's service; empty trusts no `approval.granted` delivery. */
  storeService = "";
}

registerSchemas([[ApprovalsOptions, APPROVALS_CONFIG_SCHEMA]]);
