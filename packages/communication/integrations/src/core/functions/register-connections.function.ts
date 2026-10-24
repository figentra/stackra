/**
 * Stackra file contract:
 * Purpose: `registerConnections`, which links each connection class to its Integration and the integration's key, so
 *          a store can load it, reach its Integration's options and fall back to the Integration's credentials. Gen
 *          emits one call per member from the type arguments of its `Connection<I>` classes.
 * Boundary: writes the registry only, after checking each entry: a connection class, an Integration class with at
 *           least one level, a key, and one connection class per Integration (ADR 0308 rule 2). Registering an entry
 *           again changes nothing (a reloaded dev module). Authored code never calls it outside a test.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2 and 19); ADR 0305 (rule 6).
 */
import { kindOf } from "@stackra/container";

import { CONNECTION_REGISTRY } from "#core/constants/connection-registry.constant";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import type { ConnectionRegistration } from "#core/types/connection-registration.type";

/**
 * Records each connection class's Integration and key.
 *
 * @throws TypeError when a class is not a connection or an Integration, the Integration declares no level, the key
 *         is empty, or a second connection class names an Integration already taken.
 * @example
 * registerConnections([{ connection: ResendConnection, integration: ResendIntegration, key: "messages.resend" }]);
 */
export function registerConnections(entries: readonly ConnectionRegistration[]): void {
  for (const entry of entries) {
    const { connection, integration, key } = entry;
    if (kindOf(connection)?.kind !== "connection")
      throw new TypeError(`${connection.name} does not extend Connection<Integration>`);
    if (integrationOptionsOf(integration).levels.length === 0)
      throw new TypeError(
        `${integration.name} declares no levels, so it has no connection; give it levels or drop ${connection.name}`,
      );
    if (typeof key !== "string" || key === "")
      throw new TypeError(`${connection.name} needs its integration's key`);
    for (const [other, known] of CONNECTION_REGISTRY)
      if (other !== connection && known.integration === integration)
        throw new TypeError(
          `${connection.name} and ${other.name} both connect ${integration.name}; keep one connection class per integration`,
        );
    CONNECTION_REGISTRY.set(connection, Object.freeze({ connection, integration, key }));
  }
}
