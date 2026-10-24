/**
 * Stackra file contract:
 * Purpose: `DatabaseOptions`, what `PostgresDatabaseDriver.connect` takes: the connection string, the entities, and
 *          the ORM subscribers other packages contribute (the outbox, the audit trail, the scope column filler).
 * Boundary: a type only. The connection string is a secret the runtime hands over (the generated Encore app, runway,
 *           or a test container); it is never logged and never read from a file here.
 * Runtime: node
 * Governing contract: ADR 0014 (decision 5: the connection the runtime provides); ADR 0238; ADR 0173 (secrets).
 */
import type { EntitySchema, EventSubscriber } from "@mikro-orm/core";

/** The connection options. */
export interface DatabaseOptions {
  /** The Postgres connection string of the service's own logical database. */
  readonly url: string;

  /** The entity schemas; the registered ones (`registerEntities`) when absent. */
  readonly entities?: readonly EntitySchema[];

  /** ORM subscribers, such as the outbox writer that takes each flushed model's recorded events. */
  readonly subscribers?: readonly EventSubscriber[];

  /** Log every query (development only). */
  readonly debug?: boolean;
}
