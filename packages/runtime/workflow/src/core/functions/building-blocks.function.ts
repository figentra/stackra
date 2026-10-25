/**
 * Stackra file contract:
 * Purpose: `buildingBlocks`, the registered building blocks, for the automation studio's palette and for an agent that
 *          writes an automation or a plan from natural language.
 * Boundary: reads `BUILDING_BLOCKS`; returns a fresh array in registration order, optionally of one kind.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 1: AI builds automations from the blocks); ADR 0122 (decision 3).
 */
import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import type { BlockKind } from "#core/enums/block-kind.enum";
import type { BuildingBlock } from "#core/types/building-block.type";

/**
 * The registered blocks, all or of `kind`.
 *
 * @example
 * buildingBlocks(BlockKind.Action).map((block) => block.key); // ["notifications.send_sms", ...]
 */
export function buildingBlocks(kind?: BlockKind): BuildingBlock[] {
  return [...BUILDING_BLOCKS.values()].filter((block) => kind === undefined || block.kind === kind);
}
