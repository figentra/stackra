/**
 * Stackra file contract:
 * Purpose: unit tests of `ExportAuditAction`: the `audit_log_entry.export` job under the L2 export permission, which
 *          pages through `AuditQuery` (100 a page, newest first, by sequence cursor) within the time range and pushes
 *          each non-empty page as one NDJSON batch whose lines carry the chain fields.
 * Boundary: test only; the table is an in-memory stand-in of its `find`, and the sink records every batch it gets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0465 (decision 4); STA-1579.
 */
import type { AuditEntry } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Repository } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AuditExportSink } from "#contracts/ports/audit-export-sink.port";
import type { AuditLink } from "#contracts/types/audit-link.type";
import { findAuditChainBreak } from "#core/functions/find-audit-chain-break.function";
import { linkAuditEntry } from "#core/functions/link-audit-entry.function";
import { AuditLogEntryPermissions } from "#node/access/audit-log-entry.permissions";
import { ExportAuditAction } from "#node/actions/export-audit.action";
import type { AuditLogEntry } from "#node/models/audit-log-entry.model";
import { ExportAuditInput } from "#node/schemas/export-audit-input.schema";

/** Records every batch. */
class ListAuditExportSinkDriver extends Driver(AuditExportSink) {
  readonly batches: string[] = [];

  override async push(ndjson: string): Promise<void> {
    this.batches.push(ndjson);
  }
}

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

/** `count` stored rows, newest first, as the table returns them. */
async function rowsNewestFirst(count: number): Promise<AuditLogEntry[]> {
  const links: AuditLink[] = [];
  for (let index = 1; index <= count; index++)
    links.push(await linkAuditEntry(entryOf(index), links.at(-1)));
  return [...links]
    .reverse()
    .map((link) => ({ ...link, id: `aud_${link.sequence}` }) as unknown as AuditLogEntry);
}

/** A table stand-in that honours the `sequence < cursor` filter and the limit. */
function tableOf(rows: AuditLogEntry[]) {
  return {
    find: vi.fn(async (where: { sequence?: { $lt: number } }, options: { limit: number }) =>
      rows
        .filter((row) => where.sequence === undefined || row.sequence < where.sequence.$lt)
        .slice(0, options.limit),
    ),
  };
}

describe(ExportAuditAction, () => {
  it("is the audit_log_entry.export job under the L2 export permission", () => {
    expect(kindOf(ExportAuditAction)?.options).toMatchObject({
      key: "audit_log_entry.export",
      permission: AuditLogEntryPermissions.export,
      actors: [ActorKind.User, ActorKind.Service, ActorKind.System],
      job: { timeout: "15m" },
    });
  });

  it("pushes each page as one NDJSON batch, the lines verifiable as a chain", async () => {
    const table = tableOf(await rowsNewestFirst(150));
    const sink = new ListAuditExportSinkDriver();
    const action = new ExportAuditAction(table as unknown as Repository<AuditLogEntry>, sink);
    const output = await action.handle(ExportAuditInput.create({}));
    expect(output.exported).toBe(150);
    expect(sink.batches).toHaveLength(2);
    expect(table.find).toHaveBeenNthCalledWith(2, { sequence: { $lt: 51 } }, expect.anything());
    const lines = sink.batches.join("").split("\n");
    expect(lines.at(-1)).toBe("");
    const items = lines.slice(0, -1).map((line) => JSON.parse(line) as AuditLink);
    expect(items[0]?.sequence).toBe(150);
    const oldestFirst = [...items]
      .reverse()
      .map((item): AuditLink => ({ ...item, at: new Date(item.at) }));
    expect(await findAuditChainBreak(oldestFirst)).toBeUndefined();
  });

  it("filters by the range and pushes nothing for an empty one", async () => {
    const table = tableOf([]);
    const sink = new ListAuditExportSinkDriver();
    const action = new ExportAuditAction(table as unknown as Repository<AuditLogEntry>, sink);
    const from = new Date("2026-10-01T00:00:00Z");
    const to = new Date("2026-11-01T00:00:00Z");
    const output = await action.handle(ExportAuditInput.create({ from, to }));
    expect(table.find).toHaveBeenCalledWith(
      { at: { $gte: from, $lt: to } },
      { orderBy: { sequence: "desc" }, limit: 101 },
    );
    expect(output.exported).toBe(0);
    expect(sink.batches).toEqual([]);
  });

  it("fails the run when the sink refuses a batch", async () => {
    const table = tableOf(await rowsNewestFirst(1));
    const sink = new ListAuditExportSinkDriver();
    vi.spyOn(sink, "push").mockRejectedValue(new Error("down"));
    const action = new ExportAuditAction(table as unknown as Repository<AuditLogEntry>, sink);
    await expect(action.handle(ExportAuditInput.create({}))).rejects.toThrow("down");
  });
});
