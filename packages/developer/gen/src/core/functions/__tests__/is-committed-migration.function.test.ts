/**
 * Stackra file contract:
 * Purpose: unit tests of `isCommittedMigration`: the compiled `.up.sql` and `.down.sql` files in `.stackra/migrations`,
 *          in a generated Encore service's `migrations` folder and in a package's `compiled-migrations` are committed; a package's test copies, nested
 *          folders, other generated files and look-alike folders are not.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); STA-2788.
 */
import { describe, expect, it } from "@stackra/testing";

import { isCommittedMigration } from "#core/functions/is-committed-migration.function";

describe("isCommittedMigration", () => {
  it("is true for the compiled stream and its Encore copy", () => {
    for (const path of [
      ".stackra/migrations/0001_shop_0001_create_orders.up.sql",
      ".stackra/migrations/0001_shop_0001_create_orders.down.sql",
      "stackra-encore/shop/migrations/0001_shop_0001_create_orders.up.sql",
      "stackra-encore/shop/migrations/0002_shop_0002_add_index.down.sql",
      "src/node/database/compiled-migrations/loyalty_kit_0001_create_loyalty_tables.up.sql",
      "src/node/database/compiled-migrations/loyalty_kit_0002_add_index_1.down.sql",
    ])
      expect(isCommittedMigration(path), path).toBe(true);
  });

  it("is false for test copies, nested folders and other generated files", () => {
    for (const path of [
      ".stackra/tests/migrations/0001_shop_0001_create_orders.up.sql",
      ".stackra/migrations/nested/0001_shop_0001_create_orders.up.sql",
      ".stackra/migrations/0001_shop_0001_create_orders.up.sql.bak",
      "stackra-encore/shop/database.ts",
      "stackra-encore/migrations/0001_shop_0001_create_orders.up.sql",
      "stackra-encore/shop/nested/migrations/0001.up.sql",
      "xstackra/migrations/0001.up.sql",
      "a.stackra/migrations/0001.up.sql",
      "stackra.manifest.json",
      "src/node/database/migrations/0001-create-orders.migration.ts",
      "src/node/database/compiled-migrations/nested/x.up.sql",
    ])
      expect(isCommittedMigration(path), path).toBe(false);
  });
});
