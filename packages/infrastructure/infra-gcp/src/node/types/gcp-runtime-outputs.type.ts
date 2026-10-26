/**
 * Stackra file contract:
 * Purpose: `GcpRuntimeOutputs`, what a deployment's GCP runtime stack exports: the Cloud SQL instance name and its
 *          connection name; `null` when the runway declares no database.
 * Boundary: type only; the stacks repository turns the connection name into the services' database config.
 * Runtime: node
 * Governing contract: ADR 0238, ADR 0401.
 */
import type * as pulumi from "@pulumi/pulumi";

/** One deployment's runtime outputs. */
export type GcpRuntimeOutputs = {
  /** The Cloud SQL instance's name. */
  readonly databaseInstance: pulumi.Output<string> | null;
  /** `<project>:<region>:<instance>`, which the Cloud SQL connector dials. */
  readonly databaseConnection: pulumi.Output<string> | null;
};
