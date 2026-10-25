/**
 * Stackra file contract:
 * Purpose: type tests of `LogRecord`: five readonly fields, the level being a `LogLevel`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0147.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { LogLevel } from "#contracts/enums/log-level.enum";
import type { LogRecord } from "#contracts/types/log-record.type";

describe("LogRecord", () => {
  it("has the five fields of a log line", () => {
    expectTypeOf<keyof LogRecord>().toEqualTypeOf<
      "time" | "level" | "event" | "channel" | "fields"
    >();
    expectTypeOf<LogRecord["level"]>().toEqualTypeOf<LogLevel>();
    const record: LogRecord = { time: "t", level: "info", event: "a.b", channel: "a", fields: {} };
    expect(record.channel).toBe("a");
  });
});
