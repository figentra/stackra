/**
 * Stackra file contract:
 * Purpose: `registerPlatformHosts(root, environment, store, signing)`, the Runway step that writes a product's
 *          platform `host:` rows and app-link `wellknown:` rows for one environment to the edge store.
 * Boundary: computes the rows with `edgeRowsOf` before writing any, so a missing zone, team id or fingerprint writes
 *           nothing; then writes them in order and rethrows the first store failure. DNS and Worker routes are the
 *           infra step's. KV propagation takes about a minute; the API enforces anything that must hold at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decisions 6 and 7), ADR 0441 (decision 3), ADR 0439 (decision 2).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { edgeRowsOf } from "#core/functions/edge-rows-of.function";
import type { EdgeStore } from "#core/ports/edge-store.port";
import type { AppLinkSigning } from "#core/types/app-link-signing.type";
import type { EdgeRow } from "#core/types/edge-row.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * Writes the platform rows of `environment` and answers them.
 *
 * @param root - the parsed root runway.
 * @param environment - the environment being released.
 * @param store - the edge KV copy.
 * @param signing - the Apple team ids and Android fingerprints the app-link files name.
 * @throws RunwayUnresolvedError as `edgeRowsOf` does, before any write.
 * @example
 * await registerPlatformHosts(root, "production", store, signing);
 */
export async function registerPlatformHosts(
  root: RootRunway,
  environment: RunwayEnvironment,
  store: EdgeStore,
  signing: AppLinkSigning,
): Promise<EdgeRow[]> {
  const rows = edgeRowsOf(root, environment, signing);
  for (const { key, value } of rows) await store.put(key, value);
  return rows;
}
