/**
 * Stackra file contract:
 * Purpose: unit tests of the `LogReporter` port: an abstract class that extends `Port`, so it is its own token, and a
 *          subclass that implements `report` is an instance of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16
 *                     and 17).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LogReporter } from "#core/ports/log-reporter.port";
import type { LogRecord } from "#core/types/log-record.type";

describe("LogReporter", () => {
  it("is a port a reporter implements", () => {
    const seen: LogRecord[] = [];
    class ArrayReporter extends LogReporter {
      report(record: LogRecord): void {
        seen.push(record);
      }
    }
    const reporter = new ArrayReporter();
    const record: LogRecord = {
      time: "2026-10-24T09:00:00.000Z",
      level: "info",
      event: "orders.draft_priced",
      channel: "orders",
      fields: {},
    };
    reporter.report(record);
    expect(reporter).toBeInstanceOf(LogReporter);
    expect(reporter).toBeInstanceOf(Port);
    expect(seen).toEqual([record]);
  });
});
