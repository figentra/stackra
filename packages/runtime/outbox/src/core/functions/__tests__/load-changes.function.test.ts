/**
 * Stackra file contract:
 * Purpose: unit tests of `loadChanges`: consecutive claims of one owner load together in that owner's isolation, the
 *          entries come back in claim order, an owned claim with no isolation is refused, and a claimed position that
 *          does not load is refused (`ClaimNotLoadedError`), never skipped.
 * Boundary: test only; a stand-in feed whose `load` answers the positions it is given, and a recording isolation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import type { CallIsolation } from "@stackra/actions/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/index";
import type { ChangeFeed, ChangeRecord } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { RowIsolationMissingError } from "#core/errors/row-isolation-missing.error";
import { loadChanges } from "#core/functions/load-changes.function";

const NOON = new Date(Date.UTC(2026, 10, 8, 12));

/** The entry at `position`. */
function record(position: string): ChangeRecord {
  return {
    position,
    change: { model: "Order", id: position, kind: RowChangeKind.Created, fields: [] },
    meta: {},
    occurredAt: NOON,
  };
}

/** A feed that loads every position but `missing`, in reverse, recording each load's owner. */
function feedOf(
  loads: [string | undefined, readonly string[]][],
  owner: () => string | undefined,
  missing = "",
) {
  return {
    load: async (positions: readonly string[]) => {
      loads.push([owner(), positions]);
      return positions
        .filter((position) => position !== missing)
        .map(record)
        .reverse();
    },
  } as unknown as ChangeFeed;
}

describe("loadChanges", () => {
  it("loads each run of one owner in its isolation and keeps the claim order", async () => {
    let current: string | undefined;
    const isolation = {
      run: async (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
        current = actor.scopeId;
        try {
          return await work();
        } finally {
          current = undefined;
        }
      },
    } as unknown as CallIsolation;
    const loads: [string | undefined, readonly string[]][] = [];
    const records = await loadChanges(
      feedOf(loads, () => current),
      isolation,
      [
        { position: "1:1", ownerId: "scp_acme" },
        { position: "1:2", ownerId: "scp_acme" },
        { position: "1:3" },
        { position: "1:4", ownerId: "scp_globex" },
      ],
    );
    expect(records.map((each) => each.position)).toEqual(["1:1", "1:2", "1:3", "1:4"]);
    expect(loads).toEqual([
      ["scp_acme", ["1:1", "1:2"]],
      [undefined, ["1:3"]],
      ["scp_globex", ["1:4"]],
    ]);
  });

  it("refuses an owned claim with no isolation, and a claimed position that does not load", async () => {
    const loads: [string | undefined, readonly string[]][] = [];
    await expect(
      loadChanges(
        feedOf(loads, () => undefined),
        undefined,
        [{ position: "1:1", ownerId: "scp_acme" }],
      ),
    ).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect(loads).toEqual([]);
    await expect(
      loadChanges(
        feedOf(loads, () => undefined, "1:2"),
        undefined,
        [{ position: "1:1" }, { position: "1:2" }],
      ),
    ).rejects.toMatchObject({ code: "claim_not_loaded", details: { id: "1:2" } });
    await expect(
      loadChanges(
        feedOf(loads, () => undefined, "1:2"),
        undefined,
        [{ position: "1:2" }],
      ),
    ).rejects.toBeInstanceOf(ClaimNotLoadedError);
  });
});
