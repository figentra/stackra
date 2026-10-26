/**
 * Stackra file contract:
 * Purpose: `readToolsStackPlan(directory, environment)`, the tools stack plan of a repository: its root `runway.yaml`,
 *          read and checked by `readRunway`, then planned by `toolsStackPlan`.
 * Boundary: reads one file only; never writes and never calls a cloud.
 * Runtime: node
 * Governing contract: ADR 0444; ADR 0296 (the root runway); ADR 0171 (decision 3: programs from runways).
 */
import { join } from "node:path";

import { RunwayKind } from "@stackra/runway";
import type { RunwayEnvironment } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

import { toolsStackPlan } from "#core/functions/tools-stack-plan.function";
import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";

/**
 * The plan of `environment` for the repository at `directory`.
 *
 * @throws RunwayInvalidError when the root runway is missing, unreadable or lacks a fact the stack needs.
 * @example
 * const plan = readToolsStackPlan(process.cwd(), "production");
 */
export function readToolsStackPlan(
  directory: string,
  environment: RunwayEnvironment,
): ToolsStackPlan {
  return toolsStackPlan(readRunway(join(directory, "runway.yaml"), RunwayKind.Root), environment);
}
