/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ReplicaSource` port: a keyed port whose driver answers a replica's changes since
 *          a cursor within a slice, as a `ReplicaChanges`.
 * Boundary: test only; the source is a small class of the port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 3).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ReplicaSource } from "#contracts/ports/replica-source.port";
import type { ReplicaChanges } from "#contracts/types/replica-changes.type";

describe("ReplicaSource", () => {
  it("is a keyed port whose driver answers changes since a cursor", async () => {
    const asked: [string, string | null, Readonly<Record<string, string>>][] = [];
    class FixedSource extends ReplicaSource {
      changes(
        query: string,
        cursor: string | null,
        slice: Readonly<Record<string, string>>,
      ): Promise<ReplicaChanges> {
        asked.push([query, cursor, slice]);
        return Promise.resolve({
          rows: [],
          removed: [],
          cursor: "c_1",
          asOf: "2026-10-24T09:00:00.000Z",
          full: cursor === null,
        });
      }
    }
    const source = new FixedSource();
    expect(source).toBeInstanceOf(Port);
    expect(
      (await source.changes("sales.sale.recent@1", null, { legalEntityId: "len_1" })).full,
    ).toBe(true);
    expect(asked).toEqual([["sales.sale.recent@1", null, { legalEntityId: "len_1" }]]);
    expectTypeOf<ReplicaSource["~key"]>().toEqualTypeOf<"query.ReplicaSource">();
  });
});
