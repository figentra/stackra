/**
 * Stackra file contract:
 * Purpose: `AuditOptions`, the shape of `AuditConfig`: the running environment (`STACKRA_ENVIRONMENT`), which decides
 *          whether the pipeline may run an action with no `AuditTrail` bound (only in `dev` and `test`).
 * Boundary: a shape class; it registers this package's own schema (`AUDIT_CONFIG_SCHEMA`) for itself when the module
 *           loads. `environment` is one of `StackraEnvironment` or unset; unset, the pipeline reads the runtime
 *           environment through the one reader (`readEnvironment` of @stackra/config), never a default of its own. On a
 *           server the `createApp` of `@stackra/app` always sets it to the reader's answer, so a deployment is never
 *           `dev`. The values layer can never set it: it is runtime-only (`SAFETY_CRITICAL_VARIABLES`, STA-2844).
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19 and 26); ADR 0296 (amendment
 *                     2026-11-26); STA-1571, STA-2844.
 */
import type { StackraEnvironment } from "@stackra/config";
import { registerSchemas, Schema } from "@stackra/validation";

import { AUDIT_CONFIG_SCHEMA } from "#core/constants/audit-config-schema.constant";

/**
 * The audit step's settings.
 *
 * @example
 * buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: "production" } }).environment; // "production"
 */
export class AuditOptions extends Schema {
  /** The running environment (`STACKRA_ENVIRONMENT`); outside `dev` and `test` an action needs an `AuditTrail`. */
  environment?: StackraEnvironment;
}

registerSchemas([[AuditOptions, AUDIT_CONFIG_SCHEMA]]);
