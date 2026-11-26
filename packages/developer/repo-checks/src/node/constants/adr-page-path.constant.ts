/**
 * Stackra file contract:
 * Purpose: `ADR_PAGE_PATH`, where a repository keeps its ADR pages: an ADR page is
 *          `apps/docs/src/docs/adr/NNNN-<slug>.mdx` (four digits, a dash, the slug).
 * Boundary: data only; read by the `adr-numbers`, `adr-index` and `customer-adr-links` checks.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx); STA-1732; STA-2851.
 */

/** An ADR page path; group 1 is the number, group 2 the slug. */
export const ADR_PAGE_PATH = /^apps\/docs\/src\/docs\/adr\/(\d{4})-(.+)\.mdx$/;
