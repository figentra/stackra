/**
 * Stackra file contract:
 * Purpose: `AUDIT_CONFIG_SCHEMA`, the zod schema this package ships for `AuditConfig` (exported as `AuditConfig$`): the
 *          running environment, which decides whether an action may run with no `AuditTrail` bound.
 * Boundary: the stand-in for what gen writes for this package. `environment` defaults to `dev`, as every reader of
 *           `STACKRA_ENVIRONMENT` does when it is unset, and is never empty: a deployment that sets it empty fails boot
 *           instead of running as `dev`. The default equals `AuditOptions`' initializer (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0212 (decisions 1 and 4); STA-1571.
 */
import { z } from "zod";

/** The shipped `AuditConfig$`. */
export const AUDIT_CONFIG_SCHEMA = z.object({
  environment: z.string().min(1).default("dev"),
});
