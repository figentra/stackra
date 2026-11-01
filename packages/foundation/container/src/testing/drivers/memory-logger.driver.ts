/**
 * Stackra file contract:
 * Purpose: `MemoryLoggerDriver`, the `Logger` a testing module binds when nothing else does: it keeps each line (level,
 *          event, fields) in `lines` instead of writing it anywhere, so a driver that logs boots in a member that does
 *          not depend on `@stackra/logger`, and a test can read what was logged.
 * Boundary: testing entry only; production binds `@stackra/logger`'s driver. A test that overrides `Logger`, or a
 *           wiring that lists a Logger driver, keeps its own (STA-1805).
 * Runtime: node
 * Governing contract: ADR 0266 (memory first); ADR 0263 (decision 12: tests replace, never edit, the wiring).
 */
import { Logger } from "@stackra/contracts";

import { Driver } from "#core/index";

/** A `Logger` that records its lines in memory. */
export class MemoryLoggerDriver extends Driver(Logger) {
  /** Every line logged, oldest first. */
  readonly lines: {
    readonly level: "debug" | "info" | "warn" | "error";
    readonly event: string;
    readonly fields?: Readonly<Record<string, unknown>>;
  }[] = [];

  /** Records a debug line. */
  debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "debug", event, ...(fields === undefined ? {} : { fields }) });
  }

  /** Records an info line. */
  info(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "info", event, ...(fields === undefined ? {} : { fields }) });
  }

  /** Records a warning. */
  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "warn", event, ...(fields === undefined ? {} : { fields }) });
  }

  /** Records an error. */
  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "error", event, ...(fields === undefined ? {} : { fields }) });
  }
}
