/**
 * Stackra file contract:
 * Purpose: `AuditOptions`, the shape of `AuditConfig`: the running environment (`STACKRA_ENVIRONMENT`), which decides
 *          whether the pipeline may run an action with no `AuditTrail` bound (only in `dev` and `test`).
 * Boundary: a shape class; it registers this package's own schema (`AUDIT_CONFIG_SCHEMA`) for itself when the module
 *           loads. The default is `dev`, the name every reader of `STACKRA_ENVIRONMENT` uses when it is unset; on a
 *           generated Encore service `@stackra/app`'s `createApp` sets it from where Encore runs, so a deployment is
 *           never `dev`. Any name but `dev` or `test` needs an `AuditTrail`.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19 and 26); STA-1571.
 */
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
  environment = "dev";
}

registerSchemas([[AuditOptions, AUDIT_CONFIG_SCHEMA]]);
