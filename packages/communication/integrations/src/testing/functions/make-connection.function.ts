/**
 * Stackra file contract:
 * Purpose: `makeConnection`, a loaded connection for a unit test of its `check()`, `subscribe()` or a driver that uses
 *          it: an instance of the class with its fields set and the given managed client attached.
 * Boundary: no store and no registration: the connection is built exactly as a store loads it (its `@Secret` fields
 *           non-enumerable), with the client the test gives.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rules 2 and 14).
 */
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { splitFields } from "#core/functions/split-fields.function";
import type { Connection, ConnectionClass } from "#core/index";
import type { MakeConnectionOptions } from "#testing/types/make-connection-options.type";

/**
 * A loaded connection of `type`.
 *
 * @example
 * const connection = makeConnection(ResendConnection, { api, fields: { apiKey, fromAddress, webhookSecret } });
 * await expect(connection.check()).resolves.toMatchObject({ id: "shop.acme.example" });
 */
export function makeConnection<C extends Connection>(
  type: ConnectionClass<C>,
  options: MakeConnectionOptions<C>,
): C {
  return hydrateConnection(
    type,
    {
      id: options.id ?? "conn_00000000000000000000000000",
      ...splitFields(type, options.fields),
      ...(options.source === undefined ? {} : { source: options.source }),
      ...(options.resourceId === undefined ? {} : { resourceId: options.resourceId }),
    },
    () => options.api,
  );
}
