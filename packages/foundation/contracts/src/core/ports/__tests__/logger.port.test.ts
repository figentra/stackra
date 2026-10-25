/**
 * Stackra file contract:
 * Purpose: unit tests of the `Logger` port: it is a `Port`, and an implementation receives the event name and the
 *          fields of each of the four levels exactly as the caller wrote them.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { Logger } from "#core/ports/logger.port";

type Line = readonly [level: string, event: string, fields?: Readonly<Record<string, unknown>>];

class MemoryLogger extends Logger {
  readonly lines: Line[] = [];

  override debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push(fields ? ["debug", event, fields] : ["debug", event]);
  }

  override info(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push(fields ? ["info", event, fields] : ["info", event]);
  }

  override warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push(fields ? ["warn", event, fields] : ["warn", event]);
  }

  override error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push(fields ? ["error", event, fields] : ["error", event]);
  }
}

describe("Logger", () => {
  it("is a port an implementation extends", () => {
    expect(new MemoryLogger()).toBeInstanceOf(Logger);
    expect(new MemoryLogger()).toBeInstanceOf(Port);
  });

  it("takes a snake_case event and optional fields at four levels", () => {
    const memory = new MemoryLogger();
    const logger: Logger = memory;
    const cause = new Error("sink down");
    logger.debug("orders.cache_miss");
    logger.info("orders.draft_priced", { lines: 2 });
    logger.warn("orders.slow_provider", { ms: 900 });
    logger.error("access_log_write_failed", { callId: "c1", cause });
    expect(memory.lines).toEqual([
      ["debug", "orders.cache_miss"],
      ["info", "orders.draft_priced", { lines: 2 }],
      ["warn", "orders.slow_provider", { ms: 900 }],
      ["error", "access_log_write_failed", { callId: "c1", cause }],
    ]);
  });
});
