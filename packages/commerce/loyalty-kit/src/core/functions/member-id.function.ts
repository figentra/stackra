/**
 * Stackra file contract:
 * Purpose: `memberId`, the one constructor of a `MemberId`: brands a principal id once it has been validated.
 * Boundary: a pure function with no runtime check of its own; the pipeline validated the id, the brand only stops a
 *           product id or an order id being passed where a member is meant.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 7); ADR 0135 (public ids).
 */
import { brand } from "@stackra/contracts";

import type { MemberId } from "#contracts/types/member-id.type";

/**
 * Brands a principal id after the pipeline validated it; the only way to make a `MemberId`.
 *
 * @example
 * const member = memberId(ctx.actor.id);
 */
export const memberId = brand<MemberId>();
