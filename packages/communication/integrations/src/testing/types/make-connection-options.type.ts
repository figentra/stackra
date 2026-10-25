/**
 * Stackra file contract:
 * Purpose: `MakeConnectionOptions<C>`, what `makeConnection` takes: the connection's managed client (a fake), its
 *          fields and, when the test needs a particular one, its id.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { PublicId } from "@stackra/contracts";

import type { Connection, ConnectionFields, IntegrationApi } from "#core/index";

/**
 * The options of `makeConnection`.
 *
 * @example
 * makeConnection(ResendConnection, { api, fields: { apiKey: "re_test_key", fromAddress, webhookSecret } });
 */
export interface MakeConnectionOptions<C extends Connection> {
  /** The connection's managed client, usually `fakeIntegrationApi(...)`. */
  readonly api: IntegrationApi;

  /** The connection's fields, `@Secret` ones included. */
  readonly fields: ConnectionFields<C>;

  /** The connection's id; `conn_00000000000000000000000000` when left out. */
  readonly id?: PublicId<"conn">;
}
