/**
 * Stackra file contract:
 * Purpose: `CommandAuditScopeInvalidError`, the refusal when `STACKRA_COMMAND_AUDIT_SCOPE` is not the tenant the
 *          registry marks as the platform's operations tenant (or the registry marks none): audited commands do not
 *          run, so platform operations never land in a customer tenant's audit chain or export.
 * Boundary: a typed refusal; its code is derived from the class name (`command_audit_scope_invalid`).
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-017 (the owner's S4 decision); ADR 0212 (AU4, AU6).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The configured command audit scope is not the platform's operations tenant.
 *
 * @example
 * if (operations !== scope) throw CommandAuditScopeInvalidError.create({});
 */
export class CommandAuditScopeInvalidError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
}) {}
