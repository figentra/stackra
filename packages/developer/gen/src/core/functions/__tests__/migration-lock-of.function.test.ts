/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationLockOf`: no manifest and a manifest without a `migrations` section lock nothing, a
 *          well-formed section is read in its order, and a section that is not a list, has an entry without an id or
 *          with a malformed SHA-256, or locks an id twice is refused (`migration_lock_malformed`), never read as empty.
 * Boundary: test only; manifests are built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (2026-10-23 note: the SHA-256 lock); STA-2160.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { migrationLockOf } from "#core/functions/migration-lock-of.function";

/** A 64-character hex SHA-256 made of one repeated digit. */
const sha = (digit: string): string => digit.repeat(64);

/** A manifest whose `migrations` section is `section`. */
const manifest = (section: unknown): StackraManifest =>
  ({ member: "shop", migrations: section }) as unknown as StackraManifest;

describe(migrationLockOf, () => {
  it("locks nothing without a manifest or without a migrations section", () => {
    expect(migrationLockOf(undefined)).toEqual({ locked: [], errors: [] });
    expect(migrationLockOf({ member: "shop" } as unknown as StackraManifest)).toEqual({
      locked: [],
      errors: [],
    });
  });

  it("reads a well-formed section in its order", () => {
    const section = [
      { id: "search.0001_create_text_functions", sha256: sha("2") },
      { id: "billing.0001_create_invoices", sha256: sha("1") },
    ];
    expect(migrationLockOf(manifest(section))).toEqual({ locked: section, errors: [] });
  });

  it.each([
    ["not a list", { id: "billing.0001_create_invoices" }, "is not a list"],
    ["an entry without an id", [{ sha256: sha("1") }], "entry 0"],
    ["a short SHA-256", [{ id: "billing.0001_create_invoices", sha256: "abc" }], "entry 0"],
    ["an uppercase SHA-256", [{ id: "billing.0001_create_invoices", sha256: sha("A") }], "entry 0"],
    [
      "an id locked twice",
      [
        { id: "billing.0001_create_invoices", sha256: sha("1") },
        { id: "billing.0001_create_invoices", sha256: sha("2") },
      ],
      "locks billing.0001_create_invoices twice",
    ],
  ])("refuses a section that is %s", (_name, section, message) => {
    const { locked, errors } = migrationLockOf(manifest(section));
    expect(locked).toEqual([]);
    expect(errors).toEqual([
      expect.objectContaining({
        code: "migration_lock_malformed",
        file: "stackra.manifest.json",
        subject: "migrations",
      }),
    ]);
    expect(errors[0]?.message).toContain(message);
  });
});
