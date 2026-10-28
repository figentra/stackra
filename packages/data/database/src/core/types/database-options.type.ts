/**
 * Stackra file contract:
 * Purpose: `DatabaseOptions`, what `PostgresDatabaseDriver.connect` takes: the connection string, the read replicas'
 *          connection strings, the session timeouts, the entities, and the ORM subscribers other packages contribute (the outbox, the audit
 *          trail, the scope column filler).
 * Boundary: a type only. Whether a service has replicas is deployment data (runway's `readReplica`), handed over by the
 *           runtime; no read goes to one unless it asks (`Database.onReplica`). Every connection string is a secret the runtime hands over (the generated Encore app, runway,
 *           or a test container); it is never logged and never read from a file here.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5: the connection the runtime provides); ADR 0238; ADR 0173 (secrets);
 *                     ADR 0057 (decision 6: read replica).
 */
import type { EntitySchema, EventSubscriber } from "@mikro-orm/core";

import type { SessionTimeouts } from "#core/types/session-timeouts.type";

/** The connection options. */
export interface DatabaseOptions {
  /** The Postgres connection string of the service's own logical database. */
  readonly url: string;

  /** The connection strings of the read replicas of that database; none when absent, and every read is primary. */
  readonly replicas?: readonly string[];

  /**
   * The timeouts every session (primary and replicas) starts with, from `DatabaseConfig.timeouts`; Postgres's own
   * defaults (none) when absent.
   */
  readonly timeouts?: SessionTimeouts;

  /** The entity schemas; the registered ones (`registerEntities`) when absent. */
  readonly entities?: readonly EntitySchema[];

  /** ORM subscribers, such as the outbox writer that takes each flushed model's recorded events. */
  readonly subscribers?: readonly EventSubscriber[];

  /** Log every query (development only). */
  readonly debug?: boolean;
}
