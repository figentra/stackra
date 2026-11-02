/**
 * Stackra file contract:
 * Purpose: `secretSyncPlan(environment, runways)`, each member's secret names in a sync of `environment`, with the
 *          Infisical folder that holds them and the writer that puts them into the member's runtime: a service's go to
 *          Encore (`encore secret set`), a Worker's are set by the Workers provider at deploy, a mobile app's wait for
 *          STA-2009, and any other app takes none.
 * Boundary: pure; names only, never a value. The names and folders are `deployPlan`'s `sync` (ADR 0512,
 *           `<runtime path>/<member>`); a member that declares no secret is left out.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0512; ADR 0284 (Workers members); STA-606; STA-2009 (EAS).
 */
import { deployPlan } from "#node/functions/deploy-plan.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { SecretSyncEntry } from "#node/types/secret-sync-entry.type";

/** The writer of a member's secrets, from its member root and whether the root runway ships it as a mobile app. */
function writerOf(
  folder: string | undefined,
  member: string,
  runways: DeployRunways,
): SecretSyncEntry["writer"] {
  if (folder === "services") return "encore";
  if (folder === "workers") return "cloudflare-workers";
  if (folder === "apps" && runways.root.mobile?.[member] !== undefined) return "eas";
  return "none";
}

/**
 * The secret sync plan of `environment`.
 *
 * @throws Error when the root runway has no environment `environment`.
 * @example
 * secretSyncPlan("staging", readRunways(root)); // [{ member: "api", folder: "services/api", writer: "encore", … }]
 */
export function secretSyncPlan(environment: string, runways: DeployRunways): SecretSyncEntry[] {
  const { sync } = deployPlan(environment, runways);
  return runways.members.flatMap(({ member, folder }) => {
    const own = sync.filter((entry) => entry.member === member && entry.kind === "secret");
    const first = own[0];
    if (first === undefined || first.kind !== "secret") return [];
    return [
      {
        member,
        folder: folder === undefined ? member : `${folder}/${member}`,
        names: own.map((entry) => entry.name).toSorted(),
        path: first.path,
        writer: writerOf(folder, member, runways),
      },
    ];
  });
}
