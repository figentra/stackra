/**
 * Stackra file contract:
 * Purpose: `runwayProviders(root, cwd, members)`, the providers `stackra deploy` and `stackra promote` ship through:
 *          `encore-cloud` (only when the root runway names an Encore app), `eas`, `mintlify` and `cloudflare-workers`
 *          (limited to `members` when any are named).
 * Boundary: builds the providers; changes nothing.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1 and 3); STA-607.
 */
import { buildConfig } from "@stackra/config";
import { RunwayConfig } from "@stackra/runway";
import type { RootRunway, RunwayProvider } from "@stackra/runway";
import {
  CloudflareWorkersProviderDriver,
  EasProviderDriver,
  EncoreCloudProviderDriver,
  MintlifyProviderDriver,
} from "@stackra/runway/node";

/**
 * Returns the providers for a repository root, in the order a target's destination is matched.
 *
 * @example
 * const providers = runwayProviders(readRunway("runway.yaml", "root"), process.cwd(), ["registry"]);
 */
export function runwayProviders(
  root: RootRunway,
  cwd: string,
  members: readonly string[] = [],
): RunwayProvider[] {
  const encoreApp = root.providers?.encore?.app;
  const config = buildConfig(RunwayConfig, {
    values: encoreApp === undefined ? {} : { encoreApp },
  });
  // A repository without an Encore app (core) has no `encore-cloud` provider; a target naming it fails in `deploy()`.
  return [
    ...(encoreApp === undefined ? [] : [new EncoreCloudProviderDriver(config)]),
    new EasProviderDriver(config),
    new MintlifyProviderDriver(config),
    Object.assign(new CloudflareWorkersProviderDriver(), { root: cwd, only: [...members] }),
  ];
}
