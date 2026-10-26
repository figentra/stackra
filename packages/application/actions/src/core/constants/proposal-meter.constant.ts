/**
 * Stackra file contract:
 * Purpose: `PROPOSAL_METER`, the meter every proposed call feeds: `ActionPipeline.propose` writes one `count` usage
 *          event under this name per draft, so suggest-mode agent work is metered like any other usage.
 * Boundary: a meter name, dotted snake_case. What a proposal costs, and any quota on it, is data in the usage service
 *           and the plan catalogue, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0216 (decisions 1 and 4); R3-SO-02 (a proposal is metered); ADR 0360.
 */

/** The meter of proposed (draft-only) calls. */
export const PROPOSAL_METER = "actions.proposals";
