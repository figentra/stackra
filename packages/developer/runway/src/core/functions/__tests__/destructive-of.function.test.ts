/**
 * Stackra file contract:
 * Purpose: unit tests of `destructiveOf`: `true` with sorted ids for a destructive migration the previous deploy did not
 *          ship (also beside an unknown stream), `false` when every stream is current and nothing destructive is new
 *          or none exists, and `null` without streams, for a missing or stale safety file, and for a destructive
 *          migration with no previous keys to compare.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { destructiveOf } from "#core/functions/destructive-of.function";
import type { MigrationStream } from "#core/types/migration-stream.type";

/** A classified migration row. */
const row = (id: string, destructive: boolean, files: readonly string[]) => ({
  id,
  destructive,
  files: [...files],
});

/** billing: an additive create, then a contract drop. */
const BILLING: MigrationStream = {
  member: "billing",
  safety: {
    schema: "stackra.migration-safety/v1",
    migrations: [
      row("billing.0001_create_invoices", false, ["0001_billing_0001_create_invoices"]),
      row("billing.0002_drop_note", true, ["0002_billing_0002_drop_note"]),
    ],
  },
  compiled: ["0001_billing_0001_create_invoices", "0002_billing_0002_drop_note"],
};

/** search: additive only. */
const SEARCH: MigrationStream = {
  member: "search",
  safety: {
    schema: "stackra.migration-safety/v1",
    migrations: [row("search.0001_create_items", false, ["0001_search_0001_create_items"])],
  },
  compiled: ["0001_search_0001_create_items"],
};

const NULL = { destructive: null, destructiveMigrations: [] };
const FALSE = { destructive: false, destructiveMigrations: [] };

describe("destructiveOf", () => {
  /** The drop is new since the previous deploy, which shipped only the create. */
  it("is true with the ids of the destructive migrations the previous deploy did not ship", () => {
    expect(
      destructiveOf({
        streams: [BILLING, SEARCH],
        previous: ["billing:billing.0001_create_invoices"],
      }),
    ).toEqual({ destructive: true, destructiveMigrations: ["billing.0002_drop_note"] });
  });

  it("is false when the destructive migration shipped before", () => {
    expect(
      destructiveOf({
        streams: [BILLING],
        previous: ["billing:billing.0001_create_invoices", "billing:billing.0002_drop_note"],
      }),
    ).toEqual(FALSE);
  });

  /** A key is the member's: the same id shipped by another service does not count. */
  it("compares keys per member", () => {
    expect(
      destructiveOf({ streams: [BILLING], previous: ["orders:billing.0002_drop_note"] })
        .destructive,
    ).toBe(true);
  });

  /** Nothing destructive anywhere needs no baseline; no migrations at all is false too. */
  it("is false without previous keys when no stream holds a destructive migration", () => {
    expect(destructiveOf({ streams: [SEARCH] })).toEqual(FALSE);
    expect(destructiveOf({ streams: [] })).toEqual(FALSE);
    expect(
      destructiveOf({ streams: [{ member: "health", safety: undefined, compiled: [] }] }),
    ).toEqual(FALSE);
  });

  /** Whether the drop shipped before is unknown without the previous deploy's keys. */
  it("is null for a destructive migration with no previous keys", () => {
    expect(destructiveOf({ streams: [BILLING] })).toEqual(NULL);
  });

  it("is null when the streams were not read", () => {
    expect(destructiveOf(undefined)).toEqual(NULL);
  });

  /** A missing or stale safety file does not describe what ships. */
  it("is null for a stream whose classes are missing or stale", () => {
    expect(destructiveOf({ streams: [{ ...SEARCH, safety: undefined }], previous: [] })).toEqual(
      NULL,
    );
    expect(
      destructiveOf({
        streams: [{ ...SEARCH, compiled: [...SEARCH.compiled, "0002_search_0002_add_rank"] }],
        previous: [],
      }),
    ).toEqual(NULL);
    expect(destructiveOf({ streams: [{ ...SEARCH, compiled: [] }], previous: [] })).toEqual(NULL);
  });

  /** A known true is floor whatever the other streams hold. */
  it("stays true beside an unknown stream", () => {
    expect(
      destructiveOf({ streams: [BILLING, { ...SEARCH, safety: undefined }], previous: [] }),
    ).toEqual({ destructive: true, destructiveMigrations: ["billing.0002_drop_note"] });
  });
});
