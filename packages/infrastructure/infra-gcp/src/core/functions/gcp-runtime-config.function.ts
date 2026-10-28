/**
 * Stackra file contract:
 * Purpose: `gcpRuntimeConfig(root, environment, dedicated?)`, one deployment's GCP runtime config from the root runway:
 *          the deployment (`gcpDeploymentOf`) and its Postgres server from `shared.database`: tier, version, a standby
 *          when `highAvailability`, the daily backups kept (`backups.retentionDays`) and point-in-time recovery
 *          (`backups.pitr`, `pitrDays`), pgaudit (`pgaudit`, on with `PGAUDIT_DEFAULTS` unless `false`), and the VPC
 *          it joins (`shared.network.vpc`).
 * Boundary: plain data in and out. Backups are on whenever a server exists (ADR 0186): the runway only sizes them. A
 *           dedicated deployment uses its environment's database block in its own project.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decisions 1 and 4), ADR 0238, ADR 0354, ADR 0400, ADR 0401, ADR 0212
 *                     (decision 5: pgaudit).
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, RunwayIssue } from "@stackra/runway";

import { PGAUDIT_DEFAULTS } from "#core/constants/pgaudit-defaults.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { gcpDeploymentOf } from "#core/functions/gcp-deployment-of.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";

/**
 * The GCP runtime config of `environment`, or of its dedicated deployment `dedicated`.
 *
 * @throws RunwayInvalidError when the deployment does not run on GCP, or a database names no tier or version.
 * @example
 * gcpRuntimeConfig(root, "production").database?.pitr; // { days: 7 }
 */
export function gcpRuntimeConfig(
  root: RootRunway,
  environment: RunwayEnvironment,
  dedicated?: string,
): GcpRuntimeConfig {
  const runway = parseInfraRunway(root);
  const deployment = gcpDeploymentOf(runway, environment, dedicated);
  const shared = runway.environments[environment]?.shared;
  const database = shared?.database;
  if (database === undefined) return { ...deployment, database: null };

  const issues: RunwayIssue[] = [];
  for (const key of ["tier", "version"] as const)
    if (database[key] === undefined)
      issues.push({
        path: `environments.${environment}.shared.database.${key}`,
        message: `Name the Cloud SQL ${key} of this environment's Postgres server`,
      });
  if (database.tier === undefined || database.version === undefined || issues.length > 0)
    throw new RunwayInvalidError(ROOT_SOURCE, issues);

  const backups = database.backups;
  const pgaudit = database.pgaudit;
  return {
    ...deployment,
    database: {
      tier: database.tier,
      version: database.version,
      highAvailability: database.highAvailability ?? false,
      retainedBackups: backups?.retentionDays ?? null,
      pitr: backups?.pitr === true ? { days: backups.pitrDays ?? null } : false,
      pgaudit:
        pgaudit === false
          ? false
          : {
              log: pgaudit?.log ?? PGAUDIT_DEFAULTS.log,
              retentionDays: pgaudit?.retentionDays ?? PGAUDIT_DEFAULTS.retentionDays,
            },
      network: shared?.network?.vpc ?? null,
    },
  };
}
