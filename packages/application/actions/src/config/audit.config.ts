/**
 * Stackra file contract:
 * Purpose: `AuditConfig`, the configuration of the pipeline's audit step (key `actions.audit`): the running environment,
 *          from `STACKRA_ENVIRONMENT`. Outside `dev` and `test` an action with no `AuditTrail` bound is an error, never
 *          an unaudited call (fail closed, as a missing `AccessControl` is).
 * Boundary: a configuration class over `AuditOptions`; the environment comes from the runtime. Gen binds it in every
 *           service that runs an action (`pipelinePorts`). A container that does not bind it (a hand-built resolver in
 *           a unit test) keeps the old behaviour: no trail, no audit.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4); ADR 0294 (decisions 19 and 20); ADR 0146 as amended; STA-1571.
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
