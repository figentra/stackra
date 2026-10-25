/**
 * Stackra file contract:
 * Purpose: `LOCAL_CONNECTIONS`, the records each `LocalConnectionStoreDriver` holds, by connection id.
 * Boundary: internal; kept beside the store so the testing module can put a connection in place (`.withConnection`)
 *           without a `check()` and without a seeding method on the driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 12: the local driver runs in process).
 */
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";

/** Local store to its records, each with its connection class. */
export const LOCAL_CONNECTIONS = new WeakMap<
  object,
  Map<string, ConnectionRecord & { readonly type: ConnectionClass }>
>();
