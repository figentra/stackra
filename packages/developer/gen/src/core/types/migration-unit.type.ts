/**
 * Stackra file contract:
 * Purpose: `MigrationUnit`, one compiled migration as the migration target orders and writes it: its id, whose it is
 *          (a declared package's or the member's own), the file it came from, the ids it runs after and its compiled
 *          steps (the shape `@stackra/database`'s `compileMigration` returns).
 * Boundary: a type only, structural so the pure entry needs no `@stackra/database` import. Filled by
 *           `compileMigrations` (node), read by `orderMigrations` and `emitMigrations`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decisions 1 to 3, as amended 2026-10-23 and 2026-10-24).
 */

/** One compiled migration. */
export interface MigrationUnit {
  /** `<module>.<NNNN>_<snake stem>` (`search.0001_create_text_functions`). */
  readonly id: string;

  /** `package` for a declared package's migration, `member` for the member's own; packages sort first on a tie. */
  readonly owner: "package" | "member";

  /** The file it was compiled from, for refusals. */
  readonly file: string;

  /** The migration ids, of any member, it declared it needs first (`Migration({ after })`). */
  readonly after: readonly string[];

  /** The compiled steps in apply order. */
  readonly steps: readonly {
    readonly sql: readonly string[];
    readonly transactional: boolean;
    readonly inverse: readonly string[] | false;
  }[];
}
