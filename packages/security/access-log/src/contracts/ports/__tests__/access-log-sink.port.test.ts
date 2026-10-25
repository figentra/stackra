/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogSink`: an abstract port a driver implements with one `write(record)`.
 * Boundary: test only; a list driver stands in for a real store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 5); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { ActorKind, DataClassification, Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";

/** Keeps every record in a list. */
class ListAccessLogSinkDriver extends Driver(AccessLogSink) {
  readonly written: AccessRecord[] = [];

  async write(record: AccessRecord): Promise<void> {
    this.written.push(record);
  }
}

const RECORD: AccessRecord = {
  callId: "call_1",
  actor: { kind: ActorKind.System, id: "sys_retention" },
  target: "CustomerReads.view",
  classification: DataClassification.Personal,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T00:00:00Z"),
};

describe("AccessLogSink", () => {
  it("is an abstract port", () => {
    expect(AccessLogSink.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver that writes records", async () => {
    const sink = new ListAccessLogSinkDriver();
    await expect(sink.write(RECORD)).resolves.toBeUndefined();
    expect(sink.written).toEqual([RECORD]);
    expect(sink).toBeInstanceOf(AccessLogSink);
  });

  it("takes one access record", () => {
    expectTypeOf<Parameters<AccessLogSink["write"]>[0]>().toEqualTypeOf<AccessRecord>();
  });
});
