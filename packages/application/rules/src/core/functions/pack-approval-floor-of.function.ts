/**
 * Stackra file contract:
 * Purpose: `packApprovalFloorOf(values)`, the reader of a market pack's AI approval floor: the value of the pack key
 *          `ai.approval_floor` among a tenant's resolved pack values, as the `ApprovalFloor` `resolveApproval` takes in
 *          `ApprovalRules.packFloor`.
 * Boundary: pure. The floor is pack data (a Juristra market lists the action keys an agent may at most do after a
 *           named lawyer approves); this holds no value. No such key means no pack floor (`undefined`). A value that is
 *           not a floor's shape throws rather than let a call through unguarded, as `guardFloors` does.
 * Runtime: isomorphic
 * Governing contract: ADR 0398 (decision 3: the pack floor and its action list); ADR 0370 (decisions 5 and 6: floors
 *                     are pack data); config-model section 4; STA-1250.
 */
import type { ApprovalFloor } from "@stackra/ai";
import type { ResolvedValue } from "@stackra/market-packs";
import { z } from "zod";

import { APPROVAL_FLOOR_KEY } from "#core/constants/approval-floor-key.constant";

/** The pack value's shape. */
const FLOOR = z.object({
  tags: z.array(z.string()).default([]),
  tagSets: z.array(z.array(z.string())).default([]),
  recipientLimit: z.number().int().nonnegative().optional(),
  deletes: z.boolean().default(false),
  actions: z.array(z.string()).optional(),
});

/**
 * The pack's approval floor among `values`, or `undefined` when the pack sets none.
 *
 * @throws TypeError when the value at `ai.approval_floor` is not a floor (a pack bug).
 * @example
 * resolveApproval(request, { floor, packFloor: packApprovalFloorOf(resolved), matrix, policy, preferences });
 */
export function packApprovalFloorOf(values: readonly ResolvedValue[]): ApprovalFloor | undefined {
  const entry = values.find((value) => value.key === APPROVAL_FLOOR_KEY);
  if (entry === undefined) return undefined;
  const parsed = FLOOR.safeParse(entry.value);
  if (!parsed.success)
    throw new TypeError(
      `packApprovalFloorOf: ${APPROVAL_FLOOR_KEY} of ${entry.market} ${entry.version} is not a floor`,
    );
  return Object.freeze(parsed.data) as ApprovalFloor;
}
