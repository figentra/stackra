/**
 * Stackra file contract:
 * Purpose: `APPROVALS_CONFIG_SCHEMA`, the zod schema this package ships for `ApprovalsConfig` (exported as
 *          `ApprovalsConfig$`): the service whose `approval.granted` events the approval executor acts on.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `ApprovalsOptions`' initializers (tested). An empty `storeService` trusts no
 *           delivery, so the executor fails closed until runway names the store's service.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0509 (decision 7); STA-1792.
 */
import { z } from "zod";

/** The shipped `ApprovalsConfig$`. */
export const APPROVALS_CONFIG_SCHEMA = z.object({
  storeService: z
    .string()
    .regex(/^([a-z][a-z0-9_-]*)?$/)
    .default(""),
});
