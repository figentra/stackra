/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAccessLogSinkDriver`: an `AccessLogSink` that keeps every record as one verifiable
 *          hash chain in write order, concurrent writes included, and two records of one call as two links.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0212 (decision 3).
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { MemoryAccessLogSinkDriver } from "#core/drivers/memory-access-log-sink.driver";
import { findChainBreak } from "#core/functions/find-chain-break.function";

/** A record of `target` in call `callId`. */
const recordOf = (callId: string, target: string): AccessRecord => ({
  callId,
  actor: { kind: ActorKind.System, id: "sys_test" },
  target,
  classification: DataClassification.Financial,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T08:00:00Z"),
});

describe("MemoryAccessLogSinkDriver", () => {
  it("is an AccessLogSink", () => {
    expect(new MemoryAccessLogSinkDriver()).toBeInstanceOf(AccessLogSink);
  });

  it("keeps every record as one chain, two records of one call included", async () => {
    const sink = new MemoryAccessLogSinkDriver();
    await sink.write(recordOf("call_1", "CancelOrderAction.handle"));
    await sink.write(recordOf("call_1", "OrderService.find"));
    const links = sink.records();
    expect(links.map((link) => [link.sequence, link.target])).toEqual([
      [1, "CancelOrderAction.handle"],
      [2, "OrderService.find"],
    ]);
    await expect(findChainBreak(links)).resolves.toBeUndefined();
  });

  it("never forks the chain under concurrent writes", async () => {
    const sink = new MemoryAccessLogSinkDriver();
    await Promise.all(
      ["a", "b", "c", "d"].map((call) => sink.write(recordOf(`call_${call}`, "Reads.view"))),
    );
    expect(sink.records().map((link) => link.sequence)).toEqual([1, 2, 3, 4]);
    await expect(findChainBreak(sink.records())).resolves.toBeUndefined();
  });
});
