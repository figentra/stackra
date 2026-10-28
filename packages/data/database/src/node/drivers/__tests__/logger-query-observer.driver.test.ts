/**
 * Stackra file contract:
 * Purpose: unit tests of `LoggerQueryObserverDriver`: it is a `QueryObserver`, it logs only statements at or above the
 *          slow threshold, and tags them with the running call's key and scope id.
 * Boundary: test only; the context storage is a stand-in holding one call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0142; data-layer gap scale-performance 7 (STA-1400).
 */
import { ContextStorage } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Duration, Logger } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import { QueryObserver } from "#contracts/ports/query-observer.port";
import type { QuerySample } from "#contracts/types/query-sample.type";
import { LoggerQueryObserverDriver } from "#node/drivers/logger-query-observer.driver";

/** A logger that keeps every warning. */
class KeepingLogger extends Logger {
  readonly warnings: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  override debug(): void {}

  override info(): void {}

  override warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.warnings.push([event, fields]);
  }

  override error(): void {}
}

/** A storage whose current value is one call. */
class OneCallStorage extends ContextStorage {
  override run<T>(_value: object, work: () => T): T {
    return work();
  }

  override current(): object | undefined {
    return { key: "order.list", scope: { id: "scp_1", path: "acme" } };
  }
}

const sample = (durationMs: number): QuerySample => ({
  statement: `select * from "orders" where id = ?`,
  verb: "select",
  table: "orders",
  durationMs,
  failed: false,
  replica: false,
});

describe("LoggerQueryObserverDriver", () => {
  it("logs a slow statement with the running call's key and scope", () => {
    const logger = new KeepingLogger();
    const config = buildConfig(DatabaseConfig, {
      values: { queries: { slow: Duration.seconds(0.2), repeats: 10, strict: false } },
    });
    const observer = new LoggerQueryObserverDriver(config, logger, new OneCallStorage());
    expect(observer).toBeInstanceOf(QueryObserver);
    observer.observe(sample(199));
    observer.observe(sample(200));
    expect(logger.warnings).toEqual([
      ["database.slow_query", { ...sample(200), action: "order.list", scopeId: "scp_1" }],
    ]);
  });

  it("logs without a call outside one", () => {
    const logger = new KeepingLogger();
    new LoggerQueryObserverDriver(buildConfig(DatabaseConfig), logger).observe(sample(900));
    expect(logger.warnings[0]?.[1]).not.toHaveProperty("action");
  });
});
