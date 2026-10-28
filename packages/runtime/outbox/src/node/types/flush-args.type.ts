/**
 * Stackra file contract:
 * Purpose: `FlushArgs`, the part of the ORM's flush event the outbox writer reads: the entity manager that flushes and
 *          the change sets it computed (each changed entity, how it changed, the fields written, its primary key).
 * Boundary: a structural type, so this package never imports `@mikro-orm/*` (ADR 0097 decision 2: @stackra/database
 *           is the only importer); MikroORM's `FlushEventArgs` satisfies it, so the writer passes as one of
 *           `DatabaseOptions.subscribers`.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 2); ADR 0078 (decision 4: written in the same transaction).
 */

/** What the writer reads of a flush. */
export interface FlushArgs {
  /** The entity manager that flushes; its transaction events carry the same instance. */
  readonly em: object;

  /** The flush's unit of work. */
  readonly uow: {
    /** The change sets of the flush, computed before `onFlush`. */
    getChangeSets: () => readonly {
      /** The changed entity. */
      readonly entity: object;
      /** `create`, `update`, `delete` (or their `_early` forms). */
      readonly type: string;
      /** The fields the flush writes, by property name. */
      readonly payload: object;
      /** The entity's primary key, serialised; set once the row is written. */
      getSerializedPrimaryKey: () => string | null;
    }[];
  };
}
