/**
 * Stackra file contract:
 * Purpose: unit tests of the console `LogReporter` driver: a driver of the port that writes each record as one JSON
 *          line on the console method named by its level.
 * Boundary: test only; spies on `console` and restores it after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0147 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsoleLogReporterDriver } from "#core/drivers/console-log-reporter.driver";
import { LogReporter } from "#contracts/ports/log-reporter.port";
import type { LogRecord } from "#contracts/types/log-record.type";

const RECORD: LogRecord = {
  time: "2026-10-24T09:00:00.000Z",
  level: "warn",
  event: "orders.payment_retried",
  channel: "orders",
  fields: { attempt: 2 },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConsoleLogReporterDriver", () => {
  it("is a driver of LogReporter", () => {
    expect(new ConsoleLogReporterDriver()).toBeInstanceOf(LogReporter);
    expect(kindOf(ConsoleLogReporterDriver)).toEqual({
      kind: "driver",
      options: { port: LogReporter },
    });
  });

  it("writes one JSON line on the method named by the level", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    new ConsoleLogReporterDriver().report(RECORD);
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toEqual(RECORD);
  });

  it("uses debug, info and error for those levels", () => {
    const methods = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
      info: vi.spyOn(console, "info").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
    const reporter = new ConsoleLogReporterDriver();
    for (const level of ["debug", "info", "error"] as const) reporter.report({ ...RECORD, level });
    for (const spy of Object.values(methods)) expect(spy).toHaveBeenCalledTimes(1);
  });
});
