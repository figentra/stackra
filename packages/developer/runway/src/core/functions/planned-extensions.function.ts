/**
 * Stackra file contract:
 * Purpose: `plannedExtensions(services, environment, members?)`, the approved Postgres extensions a database server
 *          must hold before migrations run: the extensions the service runways name in
 *          `environments.<env>.database.extensions`, for the given members (all of them when none are given),
 *          deduplicated and sorted.
 * Boundary: pure; parsed runways in, names out. `parseRunway` already refused any name outside `PostgresExtension`, so
 *           every name returned is approved. The AWS runtime plan asks per Postgres resource (its member consumers);
 *           the GCP runtime config asks for the environment's one server (every member).
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2, notes of 2026-11-03 and 2026-11-26: infra pre-creates the extensions the
 *                     services name), ADR 0238 (one server per environment).
 */
import type { PostgresExtension } from "#core/enums/postgres-extension.enum";
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { ServiceRunway } from "#core/types/service-runway.type";

/**
 * The extensions `members` (else every service) name for `environment`.
 *
 * @param services - each service member's parsed runway, by member key.
 * @param environment - the environment being planned.
 * @param members - the members whose database this is; a key without a runway (a workload) names none.
 * @example
 * plannedExtensions({ commerce, search }, "production"); // ["pg_trgm", "vector"]
 * plannedExtensions({ commerce, search }, "production", ["commerce"]); // ["pg_trgm"]
 */
export function plannedExtensions(
  services: Readonly<Record<string, ServiceRunway>>,
  environment: RunwayEnvironment,
  members: readonly string[] = Object.keys(services),
): PostgresExtension[] {
  const named = members.flatMap(
    (member) => services[member]?.environments[environment]?.database?.extensions ?? [],
  );
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts a copy built here; toSorted is ES2023 and the base lib is ES2022
  return [...new Set(named)].sort();
}
