/**
 * Stackra file contract:
 * Purpose: `GcpDeployment`, one deployment on GCP resolved from the root runway: the shared deployment of an
 *          environment or one dedicated tenant's, with its stack prefix, its GCP project (from the runway `cloud`),
 *          its region (its first GCP region, else `providers.gcp.region`), whether it owns the project's project-wide
 *          resources, and its cost labels.
 * Boundary: type only; plain JSON. Project ids and numbers may still be `ref:<path>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 2 to 4), ADR 0400 (the `cloud` field and dedicated deployments), ADR 0172
 *                     (decision 5: labels).
 */
import type { RunwayEnvironment } from "@stackra/runway";

/** One GCP deployment. */
export type GcpDeployment = {
  /** The runway `project`. */
  readonly project: string;
  /** The environment whose release train the deployment rides. */
  readonly environment: RunwayEnvironment;
  /** The stack prefix: `<project>-<environment>`, or `<project>-<dedicated key>` for a dedicated tenant. */
  readonly deployment: string;
  /** The dedicated deployment, or `null` for the environment's shared one. */
  readonly dedicated: { readonly key: string; readonly scope: string } | null;
  /** The key of `providers.gcp.projects` it runs in. */
  readonly projectKey: string;
  /** That project's id and number, each a quoted value or `ref:<path>`. */
  readonly cloudProject: { readonly id: string; readonly number: string };
  /** The GCP region. */
  readonly region: string;
  /** Whether it creates its project's project-wide resources (the budget): the first deployment to name the project. */
  readonly ownsProject: boolean;
  /** The provider's default labels; a dedicated deployment's `tenant` label is its tenant. */
  readonly labels: Readonly<Record<string, string>>;
};
