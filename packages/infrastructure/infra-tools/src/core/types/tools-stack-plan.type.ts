/**
 * Stackra file contract:
 * Purpose: `ToolsStackPlan`, what `toolsStackPlan` derives from the root runway for one environment: the tools stack
 *          of each region the environment deploys to, in release order; none when the environment runs no stack.
 * Boundary: type only; plain data.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444.
 */
import type { RunwayEnvironment } from "@stackra/runway";

import type { ToolsRegionPlan } from "#core/types/tools-region-plan.type";

/** One environment's tools stacks. */
export type ToolsStackPlan = {
  readonly project: string;
  readonly environment: RunwayEnvironment;
  readonly regions: readonly ToolsRegionPlan[];
};
