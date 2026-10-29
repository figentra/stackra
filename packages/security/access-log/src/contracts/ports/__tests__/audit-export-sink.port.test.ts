/**
 * Stackra file contract:
 * Purpose: unit tests of the `AuditExportSink` port: an abstract port a driver implements by accepting NDJSON batches.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 17); STA-1579.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AuditExportSink } from "#contracts/ports/audit-export-sink.port";

/** Keeps every batch in a list. */
class ListAuditExportSinkDriver extends Driver(AuditExportSink) {
  readonly batches: string[] = [];

  override async push(ndjson: string): Promise<void> {
    this.batches.push(ndjson);
  }
}

describe("AuditExportSink", () => {
  it("is an abstract port implemented by a driver that takes batches", async () => {
    expect(AuditExportSink.prototype).toBeInstanceOf(Port);
    const sink = new ListAuditExportSinkDriver();
    await sink.push('{"id":"aud_1"}\n');
    expect(sink.batches).toEqual(['{"id":"aud_1"}\n']);
  });
});
