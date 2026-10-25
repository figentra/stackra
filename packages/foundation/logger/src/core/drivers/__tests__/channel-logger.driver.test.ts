/**
 * Stackra file contract:
 * Purpose: unit tests of the channel `Logger` driver: a driver of the contracts port that derives the channel from the
 *          event, applies the global and per-channel levels and the sample rate (never to warnings and errors),
 *          redacts with the configured extra fields, stamps the clock's time, and survives a reporter that throws
 *          without leaking the record.
 * Boundary: test only; builds `LoggingConfig` through `buildConfig` as the runtime does, with a fixed clock and an
 *           in-memory reporter.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0147 (decision 1).
 */
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { Clock, Logger } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoggingConfig } from "#config/logging.config";
import { ChannelLoggerDriver } from "#core/drivers/channel-logger.driver";
import { LogReporter } from "#core/ports/log-reporter.port";
import type { LogRecord } from "#core/types/log-record.type";

const NOW = "2026-10-24T09:00:00.000Z";

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

class ArrayReporter extends LogReporter {
  readonly records: LogRecord[] = [];

  report(record: LogRecord): void {
    this.records.push(record);
  }
}

/** A driver over `values`, with the reporter it writes to. */
function setup(values: Partial<ConfigValues<LoggingConfig>> = {}): {
  logger: ChannelLoggerDriver;
  reporter: ArrayReporter;
} {
  const reporter = new ArrayReporter();
  const logger = new ChannelLoggerDriver(
    buildConfig(LoggingConfig, { values }),
    reporter,
    new FixedClock(),
  );
  return { logger, reporter };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChannelLoggerDriver", () => {
  it("is a driver of the contracts Logger port", () => {
    const { logger } = setup();
    expect(logger).toBeInstanceOf(Logger);
    expect(kindOf(ChannelLoggerDriver)).toEqual({ kind: "driver", options: { port: Logger } });
  });

  it("writes one record with the time, level, event, channel and fields", () => {
    const { logger, reporter } = setup();
    logger.info("orders.draft_priced", { orderId: "ord_1", lines: 3 });
    expect(reporter.records).toEqual([
      {
        time: NOW,
        level: "info",
        event: "orders.draft_priced",
        channel: "orders",
        fields: { orderId: "ord_1", lines: 3 },
      },
    ]);
  });

  it("uses the whole event as the channel when it has no dot, and empty fields by default", () => {
    const { logger, reporter } = setup();
    logger.warn("boot");
    expect(reporter.records[0]).toMatchObject({ channel: "boot", fields: {} });
  });

  it("drops lines below the level and keeps the rest", () => {
    const { logger, reporter } = setup({ level: "warn" });
    logger.debug("orders.a");
    logger.info("orders.b");
    logger.warn("orders.c");
    logger.error("orders.d");
    expect(reporter.records.map((record) => record.level)).toEqual(["warn", "error"]);
  });

  it("applies a channel's own level over the global one", () => {
    const { logger, reporter } = setup({ level: "warn", channels: { orders: "debug" } });
    logger.debug("orders.priced");
    logger.debug("catalogue.indexed");
    expect(reporter.records.map((record) => record.event)).toEqual(["orders.priced"]);
  });

  it("never reads a channel level from Object.prototype", () => {
    const { logger, reporter } = setup({ level: "info" });
    logger.info("constructor.built");
    expect(reporter.records).toHaveLength(1);
  });

  it("samples debug and info lines but never warnings or errors", () => {
    const { logger, reporter } = setup({ level: "debug", sampleRate: 0 });
    logger.debug("orders.a");
    logger.info("orders.b");
    logger.warn("orders.c");
    logger.error("orders.d");
    expect(reporter.records.map((record) => record.level)).toEqual(["warn", "error"]);
  });

  it("keeps a sampled line when the random draw falls under the rate", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);
    const { logger, reporter } = setup({ sampleRate: 0.5 });
    logger.info("orders.kept");
    expect(reporter.records).toHaveLength(1);
  });

  it("redacts built-in names and the configured extra fields before the reporter sees them", () => {
    const { logger, reporter } = setup({ redaction: { extraFields: ["customerId"] } });
    logger.error("orders.payment_failed", {
      customerId: "usr_1",
      password: "canary-1",
      cause: new Error("card declined"),
    });
    const [record] = reporter.records;
    expect(record?.fields).toMatchObject({
      customerId: "[redacted]",
      password: "[redacted]",
      cause: { name: "Error", message: "card declined" },
    });
    expect(JSON.stringify(record)).not.toContain("canary-1");
  });

  it("survives a reporter that throws and reports only its class and error name", () => {
    class BrokenReporter extends LogReporter {
      report(): void {
        throw new RangeError("canary-2 leaked");
      }
    }
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new ChannelLoggerDriver(
      buildConfig(LoggingConfig),
      new BrokenReporter(),
      new FixedClock(),
    );
    expect(() => logger.info("orders.priced", { orderId: "ord_1" })).not.toThrow();
    expect(error).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(error.mock.calls[0]?.[0])) as LogRecord;
    expect(line).toEqual({
      time: NOW,
      level: "error",
      event: "logger.reporter_failed",
      channel: "logger",
      fields: { reporter: "BrokenReporter", error: "RangeError" },
    });
    expect(JSON.stringify(line)).not.toContain("canary-2");
    expect(JSON.stringify(line)).not.toContain("ord_1");
  });
});
