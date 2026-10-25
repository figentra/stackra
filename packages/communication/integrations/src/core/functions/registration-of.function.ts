/**
 * Stackra file contract:
 * Purpose: `registrationOf`, the Integration and key `registerConnections` recorded for a connection class.
 * Boundary: internal; the stores and the testing module read it. An unregistered class is a missing gen run or a test
 *           that skipped the registration, so it throws a `TypeError` that says which.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2).
 */
import { CONNECTION_REGISTRY } from "#core/constants/connection-registry.constant";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRegistration } from "#core/types/connection-registration.type";

/**
 * The registration of `type`.
 *
 * @throws TypeError when `type` was never registered.
 * @example
 * registrationOf(ResendConnection).key; // "messages.resend"
 */
export function registrationOf(type: ConnectionClass): ConnectionRegistration {
  const registration = CONNECTION_REGISTRY.get(type);
  if (registration === undefined)
    throw new TypeError(
      `${type.name} has no registered integration: run stackra gen, or call registerConnections in the test`,
    );
  return registration;
}
