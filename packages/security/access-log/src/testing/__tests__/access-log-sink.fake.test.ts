/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogSinkFake`: an `AccessLogSink` that records each write, and when built failing
 *          records it and then rejects with `access_log_write_failed`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 2 and 3).
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";
import { AccessLogSinkFake } from "#testing/access-log-sink.fake";

const RECORD: AccessRecord = {
  callId: "call_1",
  actor: { kind: ActorKind.System, id: "sys_test" },
  target: "Reads.view",
  classification: DataClassification.Personal,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T08:00:00Z"),
};

describe("AccessLogSinkFake", () => {
  it("is an AccessLogSink that records each write", async () => {
    const sink = AccessLogSinkFake.with();
    expect(sink).toBeInstanceOf(AccessLogSink);
    await expect(sink.write(RECORD)).resolves.toBeUndefined();
    expect(sink.calls("write")).toEqual([RECORD]);
  });

  it("records, then rejects every write when built failing", async () => {
    const sink = AccessLogSinkFake.with({ failing: true });
    const refused: unknown = await sink.write(RECORD).catch((error: unknown) => error);
    expect(isRefusal(refused, AccessLogWriteFailedError)).toBe(true);
    expect(sink.calls("write")).toEqual([RECORD]);
  });
});
