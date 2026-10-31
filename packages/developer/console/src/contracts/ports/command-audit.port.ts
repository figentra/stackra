/**
 * Stackra file contract:
 * Purpose: the `CommandAudit` port: where the kernel records each run of a command declared `audit: true`.
 * Boundary: an abstract class that is its own token; `@stackra/access-log` implements it, and the testing entry has
 *           a memory one. A run of an audited command with no binding is refused (fail closed).
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-015 to FR-017.
 */
import { Port } from "@stackra/contracts";

import type { CommandAuditEntry } from "#contracts/types/command-audit-entry.type";

/**
 * Stores command audit entries.
 *
 * @example
 * export class AuditTrailCommandAuditDriver extends Driver(CommandAudit) {
 *   async record(entry: CommandAuditEntry): Promise<void> {
 *     await this.trail.record(toAuditEntry(entry));
 *   }
 * }
 */
export abstract class CommandAudit extends Port {
  /** Stores `entry`; resolves once it is written. */
  abstract record(entry: CommandAuditEntry): Promise<void>;
}
