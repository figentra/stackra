/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationSha256`: the same compiled migration always hashes the same; a change to a
 *          statement, an `after` id, a step's transactional flag or its inverse changes the hash; a lint comment line
 *          (`-- squawk-ignore`, `-- lint:`) does not, as the runner's checksum leaves it out.
 * Boundary: test only; compiled migrations are built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (2026-10-23 note: the SHA-256 lock); STA-2160; STA-2612.
 */
import { describe, expect, it } from "@stackra/testing";

import type { MigrationUnit } from "#core/types/migration-unit.type";
import { migrationSha256 } from "#node/functions/migration-sha256.function";

/** The one step of BASE. */
const STEP: MigrationUnit["steps"][number] = {
  sql: ['create table "billing"."invoices" ()'],
  transactional: true,
  inverse: ['drop table "billing"."invoices"'],
};

/** The compiled migration every case changes one thing of. */
const BASE: Pick<MigrationUnit, "after" | "steps"> = {
  after: ["search.0001_create_text_functions"],
  steps: [STEP],
};

/** BASE with its one step changed by `change`. */
const withStep = (
  change: Partial<MigrationUnit["steps"][number]>,
): Pick<MigrationUnit, "after" | "steps"> => ({
  ...BASE,
  steps: [{ ...STEP, ...change }],
});

describe(migrationSha256, () => {
  it("is a stable lowercase hex SHA-256", () => {
    const sha = migrationSha256(BASE);
    expect(sha).toMatch(/^[0-9a-f]{64}$/);
    expect(migrationSha256(structuredClone(BASE))).toBe(sha);
  });

  it.each([
    ["a statement", withStep({ sql: ['create table "billing"."bills" ()'] })],
    ["an after id", { ...BASE, after: [] }],
    ["the transactional flag", withStep({ transactional: false })],
    ["the inverse", withStep({ inverse: false })],
    ["an inverse statement", withStep({ inverse: ['drop table "billing"."bills"'] })],
  ])("changes with %s", (_name, changed) => {
    expect(migrationSha256(changed)).not.toBe(migrationSha256(BASE));
  });

  it("leaves out whole lint comment lines, as the runner's checksum does", () => {
    const linted = withStep({
      sql: [
        '-- lint: a reason\n-- squawk-ignore adding-field-with-default\ncreate table "billing"."invoices" ()',
      ],
    });
    expect(migrationSha256(linted)).toBe(migrationSha256(BASE));
    const commented = withStep({ sql: ['-- a note\ncreate table "billing"."invoices" ()'] });
    expect(migrationSha256(commented)).not.toBe(migrationSha256(BASE));
  });
});
