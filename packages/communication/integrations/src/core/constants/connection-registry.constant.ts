/**
 * Stackra file contract:
 * Purpose: `CONNECTION_REGISTRY`, each connection class to its Integration and key, as `registerConnections` wrote
 *          them.
 * Boundary: internal; read through `registrationOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2); ADR 0305 (rule 6).
 */
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRegistration } from "#core/types/connection-registration.type";

/** Connection class to its registration. */
export const CONNECTION_REGISTRY = new Map<ConnectionClass, ConnectionRegistration>();
