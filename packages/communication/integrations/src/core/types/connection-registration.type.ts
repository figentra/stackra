/**
 * Stackra file contract:
 * Purpose: `ConnectionRegistration`, one entry gen emits for `registerConnections`: a connection class, the
 *          Integration it binds by name (ADR 0305 rule 6) and the integration's locked key.
 * Boundary: a type only. The partner is type-only on the class (`Connection<ResendIntegration>`), so the runtime
 *           reads it from here; gen fails a mismatch with `partner_mismatch`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 19); ADR 0305 (rule 6).
 */
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { IntegrationClass } from "#core/types/integration-class.type";

/**
 * A connection class and its Integration.
 *
 * @example
 * const entry: ConnectionRegistration = {
 *   connection: ResendConnection,
 *   integration: ResendIntegration,
 *   key: "messages.resend",
 * };
 */
export interface ConnectionRegistration {
  /** The connection class. */
  readonly connection: ConnectionClass;

  /** The Integration the connection belongs to. */
  readonly integration: IntegrationClass;

  /** The integration's key from the manifest (`messages.resend`), which the store host stores it under. */
  readonly key: string;
}
