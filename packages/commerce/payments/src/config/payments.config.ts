/**
 * Stackra file contract:
 * Purpose: `PaymentsConfig`, the payments configuration (key `payments`): the first layer of package → host →
 *          environment → runway.
 * Boundary: a configuration class over `PaymentsOptions`. Values only; never per scope (that is settings) and never a
 *           secret: it names platform Connections, whose credentials stay in the connection store.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0263.
 */
import { Config } from "@stackra/config";

import { PaymentsOptions } from "#core/schemas/payments-options.schema";

/**
 * Injected by type and validated once at boot. A host overrides values in its own `src/config/payments.config.ts`,
 * under the same name with the package class aliased.
 *
 * @example
 * import { PaymentsConfig as BasePaymentsConfig } from "@stackra/payments";
 *
 * export class PaymentsConfig extends BasePaymentsConfig {
 *   override platformConnections = { eu: { stripe: "conn_…" } };
 * }
 */
export class PaymentsConfig extends Config({ schema: PaymentsOptions }) {}
