/**
 * Stackra file contract:
 * Purpose: `ADR_INDEX_PATH`, the ADR index page of a repository: one table row per ADR, linking its page and stating
 *          its status.
 * Boundary: data only; read by the `adr-index` check and the config phase.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx); STA-2851.
 */

/** The ADR index page. */
export const ADR_INDEX_PATH = "apps/docs/src/docs/adr/index.mdx";
