/**
 * Stackra file contract:
 * Purpose: `readRuntimePlan(directory, environment)`, the runtime plan of a repository: its root `runway.yaml` and
 *          each `services/<folder>/runway.yaml`, read and checked by `readRunway`, then planned by `runtimePlan`. The
 *          member key is the folder name with hyphens as underscores (`loyalty-kit` → `loyalty_kit`).
 * Boundary: reads files only; never writes and never calls a cloud. A service folder without a runway needs no
 *           runtime resource and is skipped.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1 and 2: member and root runways), ADR 0294 (member keys from folders),
 *                     ADR 0171 (decision 3: the program is generated from the repository's runways).
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { RunwayKind } from "@stackra/runway";
import type { RunwayEnvironment, ServiceRunway } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

import { runtimePlan } from "#core/functions/runtime-plan.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";

/**
 * The plan of `environment` for the repository at `directory`.
 *
 * @param directory - the repository root, which holds the root `runway.yaml`.
 * @param environment - the environment to plan.
 * @throws RunwayInvalidError when a runway file is missing (the root's), unreadable or breaks its schema, or when a
 *         dedicated cache cannot be sized.
 * @example
 * const plan = readRuntimePlan(process.cwd(), "staging");
 */
export function readRuntimePlan(directory: string, environment: RunwayEnvironment): RuntimePlan {
  const root = readRunway(join(directory, "runway.yaml"), RunwayKind.Root);
  const servicesDirectory = join(directory, "services");
  const services: Record<string, ServiceRunway> = {};
  if (existsSync(servicesDirectory)) {
    for (const entry of readdirSync(servicesDirectory, { withFileTypes: true })) {
      const file = join(servicesDirectory, entry.name, "runway.yaml");
      if (entry.isDirectory() && existsSync(file))
        services[entry.name.replaceAll("-", "_")] = readRunway(file, RunwayKind.Service);
    }
  }
  return runtimePlan(root, services, environment);
}
