/**
 * Stackra file contract:
 * Purpose: `AUDIT_CONFIG_SCHEMA`, the zod schema this package ships for `AuditConfig` (exported as `AuditConfig$`): the
 *          running environment, which decides whether an action may run with no `AuditTrail` bound.
 * Boundary: the stand-in for what gen writes for this package. `environment` is the closed list `StackraEnvironment`
 *           of @stackra/config, so a misspelt name (`prod`) fails boot instead of reading as some environment, and it
 *           has no default of its own: unset, the pipeline asks the one reader (`readEnvironment`), so this package
 *           never decides that an unset variable is `dev` (STA-2844). The default equals `AuditOptions`' (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0212 (decisions 1 and 4); ADR 0296
 *                     (amendment 2026-11-26: the environment comes from the runtime only); STA-1571, STA-2844.
 */
import { StackraEnvironment } from "@stackra/config";
import { Enum } from "@stackra/contracts";
import { z } from "zod";

/** The shipped `AuditConfig$`. */
export const AUDIT_CONFIG_SCHEMA = z.object({
  environment: z.enum(Enum.values(StackraEnvironment)).exactOptional(),
});
