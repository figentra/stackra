/**
 * Stackra file contract:
 * Purpose: `PRIMARY_CONNECTION`, the name of the one connection set a deployment has before cells: the pool of the
 *          service's own database and its replicas. A scope with no other placement is served by it.
 * Boundary: a constant only. A later cell is data (a placement naming another connection set) plus a picker (the
 *           routing `Database` driver, stackra-322), never a second constant here.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decision 6 and its Notes: cells later, "a later cell is data plus a picker"); ADR 0088
 *                     (decision 3: the connection resolver contract is free); stackra-310.
 */

/** The connection set every scope uses until a placement names another. */
export const PRIMARY_CONNECTION = "primary";
