/**
 * Stackra file contract:
 * Purpose: unit tests of `migrationKeysOf`: the sorted `<member>:<id>` keys of every current stream, and nothing when
 *          a stream is not current.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { migrationKeysOf } from "#core/functions/migration-keys-of.function";
import type { MigrationStream } from "#core/types/migration-stream.type";

/** A stream of `member` whose migration `id` became `files`, with `compiled` on disk. */
const stream = (
  member: string,
  id: string,
  files: readonly string[],
  compiled: readonly string[] = files,
): MigrationStream => ({
  member,
  safety: {
    schema: "stackra.migration-safety/v1",
    migrations: [{ id, destructive: false, files: [...files] }],
  },
  compiled,
});

describe("migrationKeysOf", () => {
  it("lists every shipped migration as <member>:<id>, sorted", () => {
    expect(
      migrationKeysOf({
        streams: [
          stream("search", "search.0001_create_items", ["0001_search_0001_create_items"]),
          stream("billing", "billing.0001_create_invoices", ["0001_billing_0001_create_invoices"]),
        ],
      }),
    ).toEqual(["billing:billing.0001_create_invoices", "search:search.0001_create_items"]);
  });

  /** An unknown stream is never recorded as shipped. */
  it("is undefined when a stream is not current", () => {
    expect(
      migrationKeysOf({ streams: [stream("search", "search.0001_x", ["0001_search_0001_x"], [])] }),
    ).toBeUndefined();
  });
});
