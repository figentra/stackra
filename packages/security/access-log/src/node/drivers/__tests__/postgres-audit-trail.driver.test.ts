/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresAuditTrailDriver`: each entry is inserted under the call's tenant as the next
 *          verifiable link after the head; a lost race retries from a fresh savepoint; five lost races and any other
 *          failure propagate; a call in no tenant is logged as `audit_write_skipped` and never fails.
 * Boundary: test only; the table, tenant isolation and the logger are in-memory stand-ins of the calls the driver
 *           makes, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0465 (decision 4); ADR 0239.
 */
import { AuditTrail } from "@stackra/actions/contracts";
import type { AuditEntry } from "@stackra/actions/contracts";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Actor, Logger } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Repository } from "@stackra/database";
import type { TenantIsolationService } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { AuditLink } from "#contracts/types/audit-link.type";
import { AUDIT_WRITE_SKIPPED } from "#core/constants/audit-write-skipped.constant";
import { findAuditChainBreak } from "#core/functions/find-audit-chain-break.function";
import { PostgresAuditTrailDriver } from "#node/drivers/postgres-audit-trail.driver";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";

const ACTOR: Actor = { kind: ActorKind.Service, id: "svc_commerce", scopeId: "scp_acme" };

/** The entry of call `callId` by `actor`. */
const entryOf = (callId: string, actor: Actor = ACTOR): AuditEntry => ({
  call: {
    callId,
    type: class {},
    kind: "action",
    key: "orders.order.create@1",
    actor,
    area: ApiArea.App,
  },
  at: new Date("2026-10-28T09:00:00Z"),
  outcome: "ok",
  fields: {},
});

/** The driver over an in-memory chain whose first `conflicts` inserts lose a race, or fail with `failure`. */
function driverWith(options: { readonly conflicts?: number; readonly failure?: Error } = {}) {
  const rows: AuditLink[] = [];
  let conflicts = options.conflicts ?? 0;
  const entries = {
    findOne: vi.fn(async () => rows.at(-1) ?? null),
    insert: vi.fn(async (data: AuditLink) => {
      if (options.failure !== undefined) throw options.failure;
      if (conflicts > 0) {
        conflicts -= 1;
        throw new UniqueViolation(new Error("duplicate key value violates unique constraint"));
      }
      rows.push(data);
      return data;
    }),
  };
  const tenancy = {
    withTenant: vi.fn(async (_actor: Actor, work: () => Promise<unknown>) => work()),
  };
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const driver = new PostgresAuditTrailDriver(
    entries as unknown as Repository<AuditLogEntry>,
    tenancy as unknown as TenantIsolationService,
    logger as unknown as Logger,
  );
  return { driver, rows, entries, tenancy, logger };
}

describe("PostgresAuditTrailDriver", () => {
  it("is an AuditTrail", () => {
    expect(driverWith().driver).toBeInstanceOf(AuditTrail);
  });

  it("writes the next link under the call's tenant", async () => {
    const { driver, rows, tenancy } = driverWith();
    await driver.record(entryOf("call_1"));
    await driver.record(entryOf("call_2"));
    expect(tenancy.withTenant).toHaveBeenCalledWith(ACTOR, expect.any(Function));
    expect(rows.map((row) => [row.sequence, row.callId])).toEqual([
      [1, "call_1"],
      [2, "call_2"],
    ]);
    await expect(findAuditChainBreak(rows)).resolves.toBeUndefined();
  });

  it("retries from a fresh savepoint after a lost race", async () => {
    const { driver, rows, entries, tenancy } = driverWith({ conflicts: 1 });
    await driver.record(entryOf("call_1"));
    expect(tenancy.withTenant).toHaveBeenCalledTimes(2);
    expect(entries.findOne).toHaveBeenCalledTimes(2);
    expect(rows).toHaveLength(1);
  });

  it("lets the fifth lost race and any other failure through", async () => {
    const racing = driverWith({ conflicts: 5 });
    await expect(racing.driver.record(entryOf("call_1"))).rejects.toBeInstanceOf(UniqueViolation);
    expect(racing.entries.insert).toHaveBeenCalledTimes(5);

    const failure = new Error("connection reset");
    const failing = driverWith({ failure });
    await expect(failing.driver.record(entryOf("call_1"))).rejects.toBe(failure);
    expect(failing.entries.insert).toHaveBeenCalledTimes(1);
  });

  it("logs and skips a call in no tenant", async () => {
    const { driver, rows, tenancy, logger } = driverWith();
    await driver.record(entryOf("call_1", { kind: ActorKind.System, id: "sys_1" }));
    expect(rows).toEqual([]);
    expect(tenancy.withTenant).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(AUDIT_WRITE_SKIPPED, {
      callId: "call_1",
      key: "orders.order.create@1",
    });
  });
});
