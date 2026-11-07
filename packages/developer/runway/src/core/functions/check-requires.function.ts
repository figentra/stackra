/**
 * Stackra file contract:
 * Purpose: `checkRequires(root, service)`, the requirement check of a parsed service runway against the root (STA-2049):
 *          a `valkey` entry of `requires` needs an environment whose cache driver is `valkey` (the member's
 *          `config.cache.driver`, else the root's `defaults.service.config.cache.driver`); with none, no driver serves
 *          it and nothing is ever provisioned for it.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print with the file. Only
 *           `valkey` is resolved to a driver: `postgres` is the database every service has, and a member's buckets and
 *           queues are its own sizes, not a `requires` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 5 and enforcement: a `requires` entry with no driver fails).
 */
import { Enum } from "@stackra/contracts";

import { RequirementEngine } from "#core/enums/requirement-engine.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import type { ServiceRunway } from "#core/types/service-runway.type";

/**
 * Every `requires` entry of `service` that no environment's driver serves; `[]` when each is served.
 *
 * @param root - the parsed root runway.
 * @param service - the parsed service runway.
 * @example
 * checkRequires(root, commerce);
 * // [{ path: "requires.cache", message: "No driver serves this valkey requirement: …" }]
 */
export function checkRequires(root: RootRunway, service: ServiceRunway): RunwayIssue[] {
  // The Valkey cache driver's name is its engine's (runtimePlan provisions a dedicated cache only where it runs).
  const drivers = new Set(
    Enum.values(RunwayEnvironment).map(
      (environment) =>
        service.environments[environment]?.config?.["cache"]?.["driver"] ??
        root.environments[environment]?.defaults?.service?.config?.["cache"]?.["driver"],
    ),
  );
  return Object.entries(service.requires ?? {})
    .filter(([, { engine }]) => engine === RequirementEngine.Valkey && !drivers.has(engine))
    .map(([name, { engine }]) => ({
      path: `requires.${name}`,
      message: `No driver serves this ${engine} requirement: no environment sets \`config.cache.driver\` to ${engine}, in the member or in the root's \`defaults.service.config\``,
    }));
}
