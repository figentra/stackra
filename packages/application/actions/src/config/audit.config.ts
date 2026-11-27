/**
 * Stackra file contract:
 * Purpose: `AuditConfig`, the configuration of the pipeline's audit step (key `actions.audit`): the running environment,
 *          from `STACKRA_ENVIRONMENT`. Outside `dev` and `test` an action with no `AuditTrail` bound is an error, never
 *          an unaudited call (fail closed, as a missing `AccessControl` is).
 * Boundary: a configuration class over `AuditOptions`; the environment comes from the runtime only: a value for it is
 *           refused at boot, and so is a name outside `StackraEnvironment` (STA-2844). Gen binds it in every service
 *           that runs an action (`pipelinePorts`). A container that binds none (a hand-built resolver, a wiring gen has
 *           not regenerated) is not exempt: the pipeline then reads the runtime environment through the one reader.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19 and 20); ADR 0296 (amendment 2026-11-26);
 *                     STA-1571, STA-2844.
 */
import { Config } from "@stackra/config";

import { AuditOptions } from "#core/schemas/audit-options.schema";

/**
 * The audit step's configuration.
 *
 * @example
 * buildConfig(AuditConfig, { env: { STACKRA_ENVIRONMENT: "staging" } }).environment; // "staging": a trail is required
 */
export class AuditConfig extends Config({
  schema: AuditOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}
