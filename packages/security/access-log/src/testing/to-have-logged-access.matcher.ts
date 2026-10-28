/**
 * Stackra file contract:
 * Purpose: `toHaveLoggedAccess`, the matcher `expect(sink).toHaveLoggedAccess({ target, subjects, actorId })` over the
 *          memory sink or the sink fake.
 * Boundary: a domain matcher owned by this package (ADR 0269 decision 3); importing the `./testing` entry registers it.
 *           It reads `records()` from the memory driver or `calls("write")` from the fake, and fails on any other
 *           sink rather than passing on nothing.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0212 (decision 5).
 */
import { createMatcher } from "@stackra/testing";

import type { AccessRecord } from "#contracts/types/access-record.type";
import { MemoryAccessLogSinkDriver } from "#core/drivers/memory-access-log-sink.driver";
import { AccessLogSinkFake } from "#testing/access-log-sink.fake";
import type { ToHaveLoggedAccessOptions } from "#testing/to-have-logged-access-options.type";

/** The records `sink` holds, or undefined when it is neither the memory driver nor the fake. */
function recordsOf(sink: unknown): readonly AccessRecord[] | undefined {
  if (sink instanceof MemoryAccessLogSinkDriver) return sink.records();
  if (sink instanceof AccessLogSinkFake) return sink.calls("write");
  return undefined;
}

/**
 * Passes when one record names `expected.target` and, when given, carries every subject and the actor id.
 *
 * @example
 * await app.get(CustomerReads).view("cus_1");
 * expect(app.get(AccessLogSink)).toHaveLoggedAccess({ target: "CustomerReads.view", subjects: ["cus_1"] });
 */
export const toHaveLoggedAccess = createMatcher(
  "toHaveLoggedAccess",
  (sink: unknown, expected: ToHaveLoggedAccessOptions) => {
    const records = recordsOf(sink);
    const pass =
      records?.some(
        (record) =>
          record.target === expected.target &&
          (expected.subjects ?? []).every((subject) => record.subjects.includes(subject)) &&
          (expected.actorId === undefined || record.actor.id === expected.actorId),
      ) ?? false;
    return {
      pass,
      message: () =>
        records === undefined
          ? "expected the memory access-log sink or AccessLogSinkFake"
          : `expected ${pass ? "no" : "an"} access record matching ${JSON.stringify(expected)} ` +
            `among ${records.length} record(s)`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts that one access record matches the expectation. */
    toHaveLoggedAccess: (expected: ToHaveLoggedAccessOptions) => R;
  }
}
