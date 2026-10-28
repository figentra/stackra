/**
 * Stackra file contract:
 * Purpose: `gcpRuntimeConfig(root, environment, dedicated?)`, one deployment's GCP runtime config from the root runway:
 *          the deployment (`gcpDeploymentOf`) and its Postgres server from `shared.database`: tier, version, a standby
 *          when `highAvailability`, the daily backups kept (`backups.retentionDays`) and point-in-time recovery
 *          (`backups.pitr`, `pitrDays`), pgaudit (`pgaudit`, on with `PGAUDIT_DEFAULTS` unless `false`), the
 *          slow-statement threshold (`slowQueryMs`, `SLOW_QUERY_MS` unless set or `false`), and the VPC it joins
 *          (`shared.network.vpc`); and its shared Valkey cache from `shared.cache` when its engine is `valkey`: node
 *          type, shards, replicas, eviction, sign-in, and the VPC and subnet it is reached on.
 * Boundary: plain data in and out. Backups are on whenever a server exists (ADR 0186): the runway only sizes them. A
 *           dedicated deployment uses its environment's database and cache blocks in its own project. Memorystore is
 *           reached only over Private Service Connect, so a cache needs `shared.network.vpc`.
 * Runtime: isomorphic
 * Governing contract: ADR 0186 (decisions 1 and 4), ADR 0238, ADR 0354, ADR 0400, ADR 0401, ADR 0212
 *                     (decision 5: pgaudit), STA-1400 (slow-statement log), ADR 0296 (decisions 1 and 5: the shared
 *                     Valkey cache).
 */
import { RequirementEngine, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, RunwayIssue } from "@stackra/runway";

import { MEMORYSTORE_NODE_TYPES } from "#core/constants/memorystore-node-types.constant";
import { PGAUDIT_DEFAULTS } from "#core/constants/pgaudit-defaults.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { SLOW_QUERY_MS } from "#core/constants/slow-query-ms.constant";
import { gcpDeploymentOf } from "#core/functions/gcp-deployment-of.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";

/** Whether `value` is a Memorystore node type. */
function isNode(value: string): value is (typeof MEMORYSTORE_NODE_TYPES)[number] {
  return (MEMORYSTORE_NODE_TYPES as readonly string[]).includes(value);
}

/**
 * The GCP runtime config of `environment`, or of its dedicated deployment `dedicated`.
 *
 * @throws RunwayInvalidError when the deployment does not run on GCP, a database names no tier or version, or a Valkey
 *         cache names a node type Memorystore does not have or has no VPC to be reached on.
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
  const cache = shared?.cache;
  const network = shared?.network?.vpc ?? null;

  const issues: RunwayIssue[] = [];
  if (database !== undefined)
    for (const key of ["tier", "version"] as const)
      if (database[key] === undefined)
        issues.push({
          path: `environments.${environment}.shared.database.${key}`,
          message: `Name the Cloud SQL ${key} of this environment's Postgres server`,
        });
  const isValkey = cache?.engine === RequirementEngine.Valkey;
  const node = cache?.node ?? MEMORYSTORE_NODE_TYPES[0];
  if (isValkey && !isNode(node))
    issues.push({
      path: `environments.${environment}.shared.cache.node`,
      message: `Expected a Memorystore node type: ${MEMORYSTORE_NODE_TYPES.join(", ")}`,
    });
  if (isValkey && network === null)
    issues.push({
      path: `environments.${environment}.shared.network.vpc`,
      message: "Name the VPC the Valkey cache is reached on: Memorystore has no public address",
    });
  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);

  const backups = database?.backups;
  const pgaudit = database?.pgaudit;
  return {
    ...deployment,
    database:
      database?.tier === undefined || database.version === undefined
        ? null
        : {
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
            slowQueryMs: database.slowQueryMs ?? SLOW_QUERY_MS,
            network,
          },
    cache:
      cache === undefined || !isValkey || !isNode(node) || network === null
        ? null
        : {
            node,
            shards: cache.shards ?? 1,
            replicas: cache.replicas ?? 0,
            eviction: cache.eviction ?? null,
            auth: cache.auth ?? "iam",
            network,
            subnet: cache.subnet ?? null,
          },
  };
}
