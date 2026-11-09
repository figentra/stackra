/**
 * Stackra file contract:
 * Purpose: `LEAD_FORM_ACTION`, where a lead form posts when its document names no `action`: the landing's own edge
 *          Worker, which forwards the lead to the tenant the host belongs to.
 * Boundary: data only; a path on the page's own origin.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); STA-2041.
 */

/** The default endpoint of a lead form. */
export const LEAD_FORM_ACTION = "/api/leads";
