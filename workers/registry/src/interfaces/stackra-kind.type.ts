/**
 * Stackra file contract:
 * Purpose: `StackraKind`: one item kind.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { STACKRA_KINDS } from "#src/constants/stackra-kinds.constant";

/** One item kind. */
export type StackraKind = (typeof STACKRA_KINDS)[number];
