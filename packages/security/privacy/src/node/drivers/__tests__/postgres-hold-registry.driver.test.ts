/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresHoldRegistryDriver`: no ids ask nothing; in a tenant's call a live hold of its own on
 *          the model's record or on a subject a row links to holds that row, a hold on another model's record of the
 *          same id does not, each refusal is logged once in that owner and nothing when nothing is held; a system run
 *          claims the live holds across tenants, checks and logs each owner's in that owner through the bound
 *          isolation, and throws rather than skip when a claimed hold does not load or a tenant's hold has no
 *          isolation to load in.
 * Boundary: test only; the database is a stand-in whose entity manager records the SQL and answers the session's owner,
 *           the claims and the hold rows, and the isolation records the owner of each unit.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0134 (holds); ADR 0239 (2026-11-07 amendment, gap A); data-layer gap gov20
 *                     (stackra-332).
 */
import { CallIsolation } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import type { Actor } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Disposal } from "@stackra/database/contracts";
import { ClaimNotLoadedError, RowIsolationMissingError } from "@stackra/outbox";
import { describe, expect, it } from "@stackra/testing";

import { PostgresHoldRegistryDriver } from "#node/drivers/postgres-hold-registry.driver";

class Invoice {}

type HoldRow = { id: string; model: string; record_id: string; owner: string | null };

/**
 * A driver over an entity manager whose session runs in `owner` (null: none), answering the holds of the session's
 * owner from `holds` and the claim with every live hold, and recording each statement with the owner it ran in.
 */
function driver(
  owner: string | null,
  holds: readonly HoldRow[],
  options: { readonly isolated?: boolean; readonly lost?: string } = {},
) {
  let session = owner;
  const executed: [string, readonly unknown[], string | null][] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[]) => {
      executed.push([sql, params, session]);
      if (sql.includes("claim_live_holds"))
        return holds.map((hold) => ({ id: hold.id, owner_id: hold.owner }));
      if (sql.includes("as owner")) return [{ owner: session }];
      if (sql.startsWith("select"))
        return holds.filter((hold) => hold.owner === session && hold.id !== options.lost);
      return [];
    },
  };
  const isolation = {
    run: async <T>(actor: Actor, _scope: unknown, work: () => Promise<T>) => {
      const enclosing = session;
      session = actor.scopeId ?? null;
      try {
        return await work();
      } finally {
        session = enclosing;
      }
    },
  };
  const container = {
    has: (type: unknown) => options.isolated === true && type === CallIsolation,
    get: () => isolation,
  } as unknown as Container;
  const database = { em: () => em } as unknown as Database;
  return { registry: new PostgresHoldRegistryDriver(database, container), executed };
}

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

describe("PostgresHoldRegistryDriver", () => {
  it("asks nothing for no ids", async () => {
    const { registry, executed } = driver(ACME, []);
    expect(await registry.heldAmong(Invoice, [], Disposal.Purge)).toEqual(new Set());
    expect(executed).toEqual([]);
  });

  it("in a tenant's call holds a record held directly or through a linked subject, and logs each refusal", async () => {
    const { registry, executed } = driver(ACME, [
      { id: "lgh_1", model: "Invoice", record_id: "inv_1", owner: ACME },
      { id: "lgh_2", model: "Customer", record_id: "cus_9", owner: ACME },
      { id: "lgh_3", model: "Order", record_id: "inv_3", owner: ACME },
    ]);
    const held = await registry.heldAmong(
      Invoice,
      ["inv_1", "inv_2", "inv_3", "inv_4"],
      Disposal.Retention,
      { inv_2: { customerId: "cus_9" }, inv_4: { customerId: "cus_8" } },
    );
    expect(held).toEqual(new Set(["inv_1", "inv_2"]));
    expect(executed.some(([sql]) => sql.includes("claim_live_holds"))).toBe(false);
    expect(executed[1]?.[0]).toContain(
      "tenant_id is not distinct from nullif(current_setting('app.tenant_id', true), '') and released_at is null and record_id in (?, ?, ?, ?, ?, ?)",
    );
    expect(executed[1]?.[1]).toEqual(["inv_1", "inv_2", "inv_3", "inv_4", "cus_9", "cus_8"]);
    expect(executed[2]?.[0]).toContain(
      'insert into "privacy"."legal_hold_refusals" (model, record_id, disposal, at)',
    );
    expect(executed[2]?.[1]).toEqual([
      "Invoice",
      "inv_1",
      "retention",
      "Invoice",
      "inv_2",
      "retention",
    ]);
  });

  it("logs nothing when nothing is held", async () => {
    const { registry, executed } = driver(ACME, []);
    expect(await registry.heldAmong(Invoice, ["inv_1"], Disposal.Delete)).toEqual(new Set());
    expect(executed).toHaveLength(2);
  });

  it("in a system run claims every owner's holds, then checks and logs each in its owner", async () => {
    const { registry, executed } = driver(
      null,
      [
        { id: "lgh_p", model: "Invoice", record_id: "inv_1", owner: null },
        { id: "lgh_a", model: "Invoice", record_id: "inv_2", owner: ACME },
        { id: "lgh_g", model: "Invoice", record_id: "inv_3", owner: GLOBEX },
      ],
      { isolated: true },
    );
    expect(
      await registry.heldAmong(Invoice, ["inv_1", "inv_2", "inv_3", "inv_4"], Disposal.Retention),
    ).toEqual(new Set(["inv_1", "inv_2", "inv_3"]));
    const claim = executed.find(([sql]) => sql.includes("claim_live_holds"));
    expect(claim?.[1]).toEqual([JSON.stringify(["inv_1", "inv_2", "inv_3", "inv_4"])]);
    expect(
      executed
        .filter(([sql]) => sql.startsWith("insert"))
        .map(([, params, owner]) => [owner, params[1]]),
    ).toEqual([
      [null, "inv_1"],
      [ACME, "inv_2"],
      [GLOBEX, "inv_3"],
    ]);
  });

  it("asks no owner when a system run claims no hold", async () => {
    const { registry, executed } = driver(null, [], { isolated: true });
    expect(await registry.heldAmong(Invoice, ["inv_1"], Disposal.Retention)).toEqual(new Set());
    expect(executed).toHaveLength(2);
  });

  it("throws, never skips, when a claimed hold does not load in its owner", async () => {
    const { registry } = driver(
      null,
      [{ id: "lgh_a", model: "Invoice", record_id: "inv_2", owner: ACME }],
      { isolated: true, lost: "lgh_a" },
    );
    await expect(registry.heldAmong(Invoice, ["inv_2"], Disposal.Retention)).rejects.toBeInstanceOf(
      ClaimNotLoadedError,
    );
  });

  it("throws, never skips, when a tenant's hold is claimed with no isolation bound", async () => {
    const { registry } = driver(null, [
      { id: "lgh_a", model: "Invoice", record_id: "inv_2", owner: ACME },
    ]);
    await expect(registry.heldAmong(Invoice, ["inv_2"], Disposal.Retention)).rejects.toBeInstanceOf(
      RowIsolationMissingError,
    );
  });
});
