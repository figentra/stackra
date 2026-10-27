/**
 * Stackra file contract:
 * Purpose: `Scheme`: one of `SCHEMES`.
 * Boundary: test support only; a type.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 5); ADR 0182 (test tiers); ADR 0022 (test placement).
 */
import type { SCHEMES } from "./schemes.constant";

/** One of {@link SCHEMES}. */
export type Scheme = (typeof SCHEMES)[number];
