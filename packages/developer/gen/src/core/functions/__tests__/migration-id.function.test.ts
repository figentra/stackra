/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationId`: `<module>.<NNNN>_<snake stem>` from a migration file name, undefined for a
 *          misnamed file.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended 2026-10-24).
 */
import { describe, expect, it } from "@stackra/testing";

import { migrationId } from "#core/functions/migration-id.function";

describe("migrationId", () => {
  it("derives the id from the module and the file name", () => {
    expect(migrationId("search", "0001-create-text-functions.migration.ts")).toBe(
      "search.0001_create_text_functions",
    );
  });

  it("returns undefined for a file that is not NNNN-<kebab>.migration.ts", () => {
    expect(migrationId("search", "create-text-functions.migration.ts")).toBeUndefined();
    expect(migrationId("search", "0001_create.migration.ts")).toBeUndefined();
  });
});
