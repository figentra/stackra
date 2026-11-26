/**
 * Stackra file contract:
 * Purpose: `ApprovalsConfig`, the approval executor's configuration (key `actions.approvals`): the service whose
 *          verified `approval.granted` events `ApprovalExecutorListener` acts on.
 * Boundary: a configuration class over `ApprovalsOptions` with no env map; runway's `config.actions.approvals` layer
 *           sets it for an owning service. Unset, the executor acts on no delivery.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0509 (decision 7); STA-1792.
 */
import { Config } from "@stackra/config";

import { ApprovalsOptions } from "#core/schemas/approvals-options.schema";

/**
 * The approval executor's configuration.
 *
 * @example
 * import { ApprovalsConfig as BaseApprovalsConfig } from "@stackra/actions";
 *
 * export class ApprovalsConfig extends BaseApprovalsConfig {
 *   override storeService = "tasks";
 * }
 */
export class ApprovalsConfig extends Config({ schema: ApprovalsOptions }) {}
