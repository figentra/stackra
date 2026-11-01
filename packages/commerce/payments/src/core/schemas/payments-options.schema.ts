/**
 * Stackra file contract:
 * Purpose: `PaymentsOptions`, the shape of the payments configuration: the platform Connection that serves each
 *          provider in each Market of this deployment.
 * Boundary: a shape class, the `schema` of `PaymentsConfig`; it registers this package's own schema
 *           (`PAYMENTS_CONFIG_SCHEMA`) for itself when the module loads, so `buildConfig(PaymentsConfig)` validates with
 *           no generated file. Deploy-time values only: which Connection the platform runs is decided at release, never
 *           per tenant (a tenant's own account is a tenant Connection).
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0294 (decisions 19 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { PAYMENTS_CONFIG_SCHEMA } from "#core/constants/payments-config-schema.constant";

/**
 * Every option the package reads; a host changes values in its config override, never here.
 *
 * @example
 * export class PaymentsConfig extends BasePaymentsConfig {
 *   override platformConnections = { eu: { stripe: "conn_…" } };
 * }
 */
export class PaymentsOptions extends Schema {
  /** Market code to provider code to the platform Connection id; a provider absent here is served only by a tenant's own account. */
  platformConnections: Record<string, Record<string, string>> = {};
}

registerSchemas([[PaymentsOptions, PAYMENTS_CONFIG_SCHEMA]]);
