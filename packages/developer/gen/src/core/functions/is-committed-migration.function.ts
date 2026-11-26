/**
 * Stackra file contract:
 * Purpose: `isCommittedMigration(path)`, whether a generated file is a compiled migration a service commits: a `.sql`
 *          file directly in `.stackra/migrations` (what `stackra db migrate` applies and the Squawk step lints) or in a
 *          generated Encore service's `migrations` folder (`stackra-encore/<member>/migrations`, what Encore applies).
 *          Both are committed, so the SQL a pull request shows is the SQL a deploy runs (STA-2788). So is a package's
 *          compiled SQL of its own migrations (`src/node/database/compiled-migrations`), which it ships.
 * Boundary: pure; `path` is relative to the member root, with `/` separators. A package's test stream under
 *           `.stackra/tests/migrations` (its own migrations and what they build on, numbered) is test output, not
 *           committed.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3: the compiled stream, Squawk); ADR 0294 (decision 22: `stackra gen --check`);
 *                     STA-2788 (compiled migrations are committed and applied as committed).
 */
import { ENCORE_SERVICES_DIR } from "#core/constants/encore-services-dir.constant";
import { MIGRATIONS_DIR } from "#core/constants/migrations-dir.constant";
import { PACKAGE_MIGRATIONS_DIR } from "#core/constants/package-migrations-dir.constant";

/** One file name, no folder. */
const NAME = "[^/]+\\.sql";

/** `.stackra/migrations/<name>.sql`, `stackra-encore/<member>/migrations/<name>.sql` or a package's committed SQL. */
const COMMITTED_MIGRATION = new RegExp(
  `^(?:${MIGRATIONS_DIR.replaceAll(".", "\\.")}|${ENCORE_SERVICES_DIR}/[^/]+/migrations|${PACKAGE_MIGRATIONS_DIR})/${NAME}$`,
);

/**
 * Whether the member-relative `path` is a compiled migration the member commits.
 *
 * @param path - a generated file's path, relative to the member root.
 * @example
 * isCommittedMigration(".stackra/migrations/0001_shop_0001_create_orders.up.sql"); // true
 * isCommittedMigration("stackra-encore/shop/migrations/0001_shop_0001_create_orders.up.sql"); // true
 * isCommittedMigration("src/node/database/compiled-migrations/shop_0001_create_orders.up.sql"); // true
 * isCommittedMigration(".stackra/tests/migrations/0001_shop_0001_create_orders.up.sql"); // false
 */
export function isCommittedMigration(path: string): boolean {
  return COMMITTED_MIGRATION.test(path);
}
