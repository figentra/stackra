/**
 * Stackra file contract:
 * Purpose: `hydrateConnection`, which builds a loaded connection from a record: an instance of its class with the
 *          plain fields set, the `@Secret` fields set as non-enumerable properties, and its id and managed client
 *          attached.
 * Boundary: internal; the stores and `makeConnection` call it. Secret fields are non-enumerable, so spreading,
 *           `JSON.stringify` or a logger never carries them, while the class's own code reads them as fields. The
 *           client is made once the instance exists, because it reads the connection's fields for its placeholders.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 3, 13 and 20).
 */
import type { Connection } from "#core/bases/connection.base";
import { CONNECTION_STATE } from "#core/constants/connection-state.constant";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { IntegrationApi } from "#core/types/integration-api.type";

/**
 * A loaded connection.
 *
 * @param apiFor - makes the connection's managed client.
 * @example
 * const connection = hydrateConnection(ResendConnection, record, (built) => runtime.client(resend, built));
 */
export function hydrateConnection<C extends Connection>(
  type: ConnectionClass<C>,
  record: Pick<ConnectionRecord, "id" | "fields" | "secrets">,
  apiFor: (connection: C) => IntegrationApi,
): C {
  const connection = Reflect.construct(type, []) as C;
  for (const [field, value] of Object.entries(record.fields)) Reflect.set(connection, field, value);
  for (const [field, value] of Object.entries(record.secrets))
    Object.defineProperty(connection, field, {
      value,
      enumerable: false,
      writable: false,
      configurable: true,
    });
  const state: { readonly id: ConnectionRecord["id"]; api?: IntegrationApi } = { id: record.id };
  CONNECTION_STATE.set(connection, state);
  state.api = apiFor(connection);
  return connection;
}
