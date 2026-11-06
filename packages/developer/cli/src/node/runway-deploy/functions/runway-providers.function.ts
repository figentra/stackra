/**
 * Stackra file contract:
 * Purpose: `runwayProviders(root, cwd, members)`, the providers `stackra deploy` and `stackra promote` ship through:
 *          `encore-cloud` (only when the root runway names an Encore app), `eas`, `mintlify` and `cloudflare-workers`
 *          (limited to `members` when any are named). With `secrets.sync: on-deploy` the Workers provider gets the
 *          repository's runways (`readRunways`), so a Worker's secrets come from Infisical, not this process's
 *          environment (ADR 0173).
 * Boundary: builds the providers and reads the runway files; changes nothing.
 * Runtime: node
 * Governing contract: ADR 0352 (decisions 1 and 3); ADR 0173; STA-606; STA-607.
 */
import { buildConfig } from "@stackra/config";
import { RunwayConfig } from "@stackra/runway";
import type { RootRunway, RunwayProvider } from "@stackra/runway";
import {
  CloudflareWorkersProviderDriver,
  EasProviderDriver,
  EncoreCloudProviderDriver,
  MintlifyProviderDriver,
  readRunways,
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
    Object.assign(new CloudflareWorkersProviderDriver(), {
      root: cwd,
      only: [...members],
      // ADR 0173: with the sync on, a Worker's secrets come from Infisical, not this process's environment.
      ...(root.secrets?.sync === "on-deploy" ? { runways: readRunways(cwd) } : {}),
    }),
  ];
}
