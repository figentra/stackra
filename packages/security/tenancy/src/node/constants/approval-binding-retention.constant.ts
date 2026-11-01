/**
 * Stackra file contract:
 * Purpose: `APPROVAL_BINDING_RETENTION`, how long a binding is kept after its request's window and execution tail ended:
 *          the audit retention window, 400 days.
 * Boundary: a constant read by `PruneApprovalBindingsAction`. The binding is insert-only and has no final-state column,
 *           so it is deleted once `expiresAt` + the execution tail (24 hours, the idempotency TTL) + this window has
 *           passed.
 * Runtime: node
 * Governing contract: ADR 0509 (N7, the prune); ADR 0212 (decision 6: thirteen months hot, 396 days, rounded up).
 */
import { Duration } from "@stackra/contracts";

// shortcut: ADR 0212 states thirteen months hot and ships no code constant (the access log's `auditRetentionDays` is
// unset), so this is 400 days (13 months rounded up); replace it with the shared constant when the audit package ships one.
/** The audit retention window a binding outlives its request by. */
export const APPROVAL_BINDING_RETENTION = Duration.days(400);
