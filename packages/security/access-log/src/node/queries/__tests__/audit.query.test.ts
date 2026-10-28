/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditQuery`: the `audit_log_entry.search` query under the L1 read permission, which reads one
 *          row more than the limit, newest first, maps the filters to one `find`, and pages by sequence.
 * Boundary: test only; the table is an in-memory stand-in of its `find`, so no Postgres runs and no policy applies.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0465 (decision 4); the HTTP conventions (cursor pagination).
 */
import type { AuditEntry } from "@stackra/actions/contracts";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { linkAuditEntry } from "#core/functions/link-audit-entry.function";
import { AuditLogEntryPermissions } from "#node/access/audit-log-entry.permissions";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";
import { AuditQuery } from "#node/queries/audit.query";
import { AuditQueryInput } from "#node/schemas/audit-query-input.schema";

/** The entry of call `index`. */
const entryOf = (index: number): AuditEntry => ({
  call: {
    callId: `call_${index}`,
    type: class {},
    kind: "action",
    key: "orders.order.create@1",
    actor: { kind: ActorKind.Service, id: "svc_1", scopeId: "scp_acme" },
    area: ApiArea.App,
  },
  at: new Date(Date.UTC(2026, 9, 28, 9, index)),
  outcome: "ok",
  fields: {},
});

/** Three stored rows, newest first, as the table returns them. */
async function rowsNewestFirst(): Promise<AuditLogEntry[]> {
  const first = await linkAuditEntry(entryOf(1));
  const second = await linkAuditEntry(entryOf(2), first);
  const third = await linkAuditEntry(entryOf(3), second);
  return [third, second, first].map(
    (link, index) => ({ ...link, id: `aud_${index}` }) as unknown as AuditLogEntry,
  );
}

describe(AuditQuery, () => {
  it("is the audit_log_entry.search query under the read permission", () => {
    expect(kindOf(AuditQuery)?.options).toMatchObject({
      key: "audit_log_entry.search",
      permission: AuditLogEntryPermissions.read,
      actors: [ActorKind.User, ActorKind.Service],
    });
  });

  it("returns one page newest first with the next cursor", async () => {
    const rows = await rowsNewestFirst();
    const entries = { find: vi.fn(async () => rows) };
    const query = new AuditQuery(entries as unknown as Repository<AuditLogEntry>);
    const output = await query.handle(AuditQueryInput.create({ limit: 2 }));
    expect(entries.find).toHaveBeenCalledWith({}, { orderBy: { sequence: "desc" }, limit: 3 });
    expect(output.items.map((item) => item.sequence)).toEqual([3, 2]);
    expect(output.hasMore).toBe(true);
    expect(output.nextCursor).toBe("2");
  });

  it("maps every filter and the cursor to one find, and ends on a short page", async () => {
    const rows = (await rowsNewestFirst()).slice(2);
    const entries = { find: vi.fn(async () => rows) };
    const query = new AuditQuery(entries as unknown as Repository<AuditLogEntry>);
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date("2026-11-01T00:00:00Z");
    const output = await query.handle(
      AuditQueryInput.create({
        limit: 20,
        cursor: "2",
        callId: "call_1",
        key: "orders.order.create@1",
        actorId: "svc_1",
        outcome: "ok",
        from,
        to,
      }),
    );
    expect(entries.find).toHaveBeenCalledWith(
      {
        callId: "call_1",
        key: "orders.order.create@1",
        outcome: "ok",
        actor: { id: "svc_1" },
        at: { $gte: from, $lt: to },
        sequence: { $lt: 2 },
      },
      { orderBy: { sequence: "desc" }, limit: 21 },
    );
    expect(output.items).toHaveLength(1);
    expect(output.hasMore).toBe(false);
    expect(output.nextCursor).toBeUndefined();
  });
});
