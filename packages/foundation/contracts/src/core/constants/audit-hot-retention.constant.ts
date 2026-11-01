/**
 * Stackra file contract:
 * Purpose: `AUDIT_HOT_RETENTION`, how long audit evidence stays hot (ADR 0212 decision 6: thirteen months): 397 days.
 * Boundary: a constant. `Duration` refuses months by design, and 397 days is the longest any thirteen consecutive
 *           calendar months can run (8 x 31 + 4 x 30 + 29), so nothing is pruned early. Read by the approval binding
 *           prune (ADR 0509); the access log's `auditRetentionDays` stays the owner's stated number with no code default.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 6 and the note of 2026-11-02); ADR 0509.
 */
import { Duration } from "#core/constants/duration.constant";

/** The hot audit retention window: thirteen months, as 397 days. */
export const AUDIT_HOT_RETENTION = Duration.days(397);
