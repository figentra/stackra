/**
 * Stackra file contract:
 * Purpose: `NativeWrite`, one write a `CrudService` verb made with a native statement (`increment`, `delete`,
 *          `restore`, `repath`, `purge`), which no ORM flush event reports: the model, the rows it reached, how they
 *          changed and which fields it set.
 * Boundary: a type only, handed to the connected `NativeWriteWatcher` right after the statement, inside the caller's
 *           transaction. It names rows, never their values: a native statement has no entity to read them from.
 * Runtime: node
 * Governing contract: data-layer gap mo10 (native writes reach the change feed); ADR 0078 (decision 4).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import type { AnyClass } from "@stackra/container";

/** One native write. */
export interface NativeWrite {
  /** The entity manager whose transaction ran the statement; a watcher writes on it to commit with it. */
  readonly em: EntityManager;

  /** The written model. */
  readonly model: AnyClass;

  /** How the rows changed: the codes of @stackra/outbox's `RowChangeKind`. */
  readonly kind: "created" | "updated" | "deleted";

  /** The primary keys of the rows the statement reached, serialised. */
  readonly ids: readonly string[];

  /** The fields it set; none for a delete. */
  readonly fields: readonly string[];
}
