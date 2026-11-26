/**
 * Stackra file contract:
 * Purpose: `QUARANTINE_MAX_DAYS`, the longest a quarantine may run before it must be renewed: an end date further
 *          out than this is a finding, so every quarantined test is looked at again within a month.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4, the flaky-test quarantine); STA-2842.
 */

/** Days from today a quarantine's `until` may reach. */
export const QUARANTINE_MAX_DAYS = 30;
