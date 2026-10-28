/**
 * Stackra file contract:
 * Purpose: `DeletedReadOptions`, the read options that reach the rows a keep-the-row delete policy hides:
 *          `withDeleted`/`onlyDeleted` for a `SoftDeletes` model, `withArchived`/`onlyArchived` for an `Archivable` one.
 * Boundary: a type only, taken by `CrudService`'s reads next to MikroORM's own options. Each turns the named filter
 *           (`deleted`, `archived`) off for that read; the `only` forms also keep just the hidden rows. Visibility and
 *           row-level security still apply.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 4); ADR 0305 (rules 10 to 13).
 */

/** The hidden-row read options. */
export interface DeletedReadOptions {
  /** Include soft-deleted rows. */
  readonly withDeleted?: boolean;

  /** Only soft-deleted rows (the trash). */
  readonly onlyDeleted?: boolean;

  /** Include archived rows. */
  readonly withArchived?: boolean;

  /** Only archived rows. */
  readonly onlyArchived?: boolean;
}
