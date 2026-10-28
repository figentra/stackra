/**
 * Stackra file contract:
 * Purpose: `GcpRuntimeOutputs`, what a deployment's GCP runtime stack exports: the Cloud SQL instance name and its
 *          connection name, `null` when the runway declares no database; and the Valkey cache's instance name and
 *          discovery `host:port`, `null` when it declares no Valkey cache.
 * Boundary: type only; the stacks repository turns the connection name into the services' database config, and the
 *           cache endpoint into the `CACHE_VALKEY_URL` secret.
 * Runtime: node
 * Governing contract: ADR 0238, ADR 0401, ADR 0296 (decisions 1 and 5: the shared Valkey cache).
 */
import type * as pulumi from "@pulumi/pulumi";

/** One deployment's runtime outputs. */
export type GcpRuntimeOutputs = {
  /** The Cloud SQL instance's name. */
  readonly databaseInstance: pulumi.Output<string> | null;
  /** `<project>:<region>:<instance>`, which the Cloud SQL connector dials. */
  readonly databaseConnection: pulumi.Output<string> | null;
  /** The Memorystore for Valkey instance's name. */
  readonly cacheInstance: pulumi.Output<string> | null;
  /** The `host:port` clients discover the cache through, inside the VPC. */
  readonly cacheEndpoint: pulumi.Output<string> | null;
};
