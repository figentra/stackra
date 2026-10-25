/**
 * Stackra file contract:
 * Purpose: `DOCUMENT_WORKFLOW`, the workflow key the journal stores a run of an automation document or a plan under,
 *          so a resume knows to rebuild the plan from the document the run carries rather than from a class.
 * Boundary: internal. It is a module key and a name like any registered key, and no class registers it.
 * Runtime: isomorphic
 * Governing contract: ADR 0152 (decision 5: one graph format); ADR 0245 (decision 8: plans are ephemeral workflows).
 */

/** The key of a document run. */
export const DOCUMENT_WORKFLOW = "workflow.document";
