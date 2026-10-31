/**
 * Stackra file contract:
 * Purpose: `MemoryCommandAuditDriver`, the in-memory `CommandAudit`: keeps each entry in `entries`, for tests of
 *          audited commands.
 * Boundary: process memory only; `failWith` makes the next records throw, to test a sink that is down.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-017.
 */
import { Driver } from "@stackra/container";

import { CommandAudit } from "#contracts/ports/command-audit.port";
import type { CommandAuditEntry } from "#contracts/types/command-audit-entry.type";

/**
 * Audit entries in an array.
 *
 * @example
 * const audit = new MemoryCommandAuditDriver();
 * await runCommandForTest([MigrateCommand], ["db:migrate"], { audit });
 * expect(audit.entries[0]?.command).toBe("db:migrate");
 */
export class MemoryCommandAuditDriver extends Driver(CommandAudit) {
  /** The recorded entries, oldest first. */
  readonly entries: CommandAuditEntry[] = [];

  /** The error every record throws while set. */
  private failure: Error | undefined;

  /** Makes every later record throw `error`; returns this driver. */
  failWith(error: Error): this {
    this.failure = error;
    return this;
  }

  /** Implements `CommandAudit.record`, documented there. */
  async record(entry: CommandAuditEntry): Promise<void> {
    if (this.failure !== undefined) throw this.failure;
    this.entries.push(entry);
  }
}
