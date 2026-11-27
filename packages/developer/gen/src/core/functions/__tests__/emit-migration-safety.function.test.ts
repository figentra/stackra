/**
 * Stackra file contract:
 * Purpose: unit tests of `emitMigrationSafety`: one `.stackra/migration-safety.json` holding the classified document
 *          as two-space JSON with a trailing newline, which `runway evidence` parses back unchanged.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3); ADR 0533 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitMigrationSafety } from "#core/functions/emit-migration-safety.function";
import type { MigrationSafety } from "#core/types/migration-safety.type";

const SAFETY: MigrationSafety = {
  schema: "stackra.migration-safety/v1",
  migrations: [
    {
      id: "orders.0001_create_orders",
      owner: "member",
      file: "src/modules/orders/database/migrations/0001-create-orders.migration.ts",
      class: "additive",
      destructive: false,
      files: ["0001_orders_0001_create_orders"],
      findings: [],
    },
  ],
};

describe("emitMigrationSafety", () => {
  it("writes the document to .stackra/migration-safety.json", () => {
    const file = emitMigrationSafety(SAFETY);

    expect(file.path).toBe(".stackra/migration-safety.json");
    expect(file.content.endsWith("}\n")).toBe(true);
    expect(JSON.parse(file.content)).toEqual(SAFETY);
  });
});
