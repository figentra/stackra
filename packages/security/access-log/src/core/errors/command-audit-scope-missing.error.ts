/**
 * Stackra file contract:
 * Purpose: `CommandAuditScopeMissingError`, the refusal `AuditTrailCommandAuditDriver` throws when
 *          `AccessLogConfig.commandAuditScope` is unset: the write audit is tenant-owned, so a console command entry has
 *          no chain to go in.
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable until the configuration is set. It carries no details.
 *           The audited command is refused rather than run unrecorded (fail closed).
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-015; ADR 0140 (envelope and kinds); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Set `STACKRA_COMMAND_AUDIT_SCOPE` to the platform's operations tenant id.
 *
 * @example
 * throw CommandAuditScopeMissingError.create({});
 */
export class CommandAuditScopeMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
}) {}
