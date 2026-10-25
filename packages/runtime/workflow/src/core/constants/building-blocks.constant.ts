/**
 * Stackra file contract:
 * Purpose: `BUILDING_BLOCKS`, the registered building blocks by key: what an automation document and a plan may name.
 * Boundary: module state of the process, written only by `registerBlocks`, read by `buildingBlocks`, the automation
 *           check, the engine and the explorer.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 1); ADR 0122 (decision 3).
 */
import type { BuildingBlock } from "#core/types/building-block.type";

/** Key to block. */
export const BUILDING_BLOCKS = new Map<string, BuildingBlock>();
