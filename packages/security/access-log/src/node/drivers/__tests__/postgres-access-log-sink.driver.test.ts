/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresAccessLogSinkDriver`: each write runs in a transaction of its own under the record's
 *          tenant and inserts the next verifiable link after the head; a lost race reads the new head and retries;
 *          five lost races refuse with `access_log_write_failed`; any other failure propagates.
 * Boundary: test only; the table, the database and tenant isolation are in-memory stand-ins of the three calls the
 *           driver makes, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0239.
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Database, Repository } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import type { TenantIsolationService } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessLink } from "#contracts/types/access-link.type";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";
import { findChainBreak } from "#core/functions/find-chain-break.function";
import { PostgresAccessLogSinkDriver } from "#node/drivers/postgres-access-log-sink.driver";
import type { AccessLogEntry } from "#node/models/access-log-entry.model";

const ACTOR: Actor = { kind: ActorKind.Service, id: "svc_commerce", tenantId: "scp_acme" };

/** A record of call `callId`. */
const recordOf = (callId: string): AccessRecord => ({
  callId,
  actor: ACTOR,
  target: "OrderService.find",
  classification: DataClassification.Pseudonymous,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T08:00:00Z"),
});

/** The driver over an in-memory chain whose first `conflicts` inserts lose a race, or fail with `failure`. */
function driverWith(options: { readonly conflicts?: number; readonly failure?: Error } = {}) {
  const rows: AccessLink[] = [];
  let conflicts = options.conflicts ?? 0;
  const entries = {
    findOne: vi.fn(async () => rows.at(-1) ?? null),
    insert: vi.fn(async (data: AccessLink) => {
      if (options.failure !== undefined) throw options.failure;
      if (conflicts > 0) {
        conflicts -= 1;
        throw new UniqueViolation(new Error("duplicate key value violates unique constraint"));
      }
      rows.push(data);
      return data;
    }),
  };
  const database = {
    transaction: vi.fn(async (work: () => Promise<unknown>, _options?: object) => work()),
  };
  const tenancy = {
    withTenant: vi.fn(async (_actor: Actor, work: () => Promise<unknown>) => work()),
  };
  const driver = new PostgresAccessLogSinkDriver(
    entries as unknown as Repository<AccessLogEntry>,
    database as unknown as Database,
    tenancy as unknown as TenantIsolationService,
  );
  return { driver, rows, entries, database, tenancy };
}

describe("PostgresAccessLogSinkDriver", () => {
  it("is an AccessLogSink", () => {
    expect(driverWith().driver).toBeInstanceOf(AccessLogSink);
  });

  it("writes the next link in a transaction of its own, under the record's tenant", async () => {
    const { driver, rows, database, tenancy } = driverWith();
    await driver.write(recordOf("call_1"));
    await driver.write(recordOf("call_2"));
    expect(database.transaction).toHaveBeenCalledWith(expect.any(Function), {
      requiresNew: true,
    });
    expect(tenancy.withTenant).toHaveBeenCalledWith(ACTOR, expect.any(Function));
    expect(rows.map((row) => [row.sequence, row.callId])).toEqual([
      [1, "call_1"],
      [2, "call_2"],
    ]);
    await expect(findChainBreak(rows)).resolves.toBeUndefined();
  });

  it("reads the new head and retries after a lost race", async () => {
    const { driver, rows, entries } = driverWith({ conflicts: 1 });
    await driver.write(recordOf("call_1"));
    expect(entries.findOne).toHaveBeenCalledTimes(2);
    expect(rows).toHaveLength(1);
  });

  it("refuses after five lost races and lets any other failure through", async () => {
    const racing = driverWith({ conflicts: 5 });
    const refused: unknown = await racing.driver
      .write(recordOf("call_1"))
      .catch((error: unknown) => error);
    expect(isRefusal(refused, AccessLogWriteFailedError)).toBe(true);
    expect(racing.entries.insert).toHaveBeenCalledTimes(5);

    const failure = new Error("connection reset");
    await expect(driverWith({ failure }).driver.write(recordOf("call_1"))).rejects.toBe(failure);
  });
});
