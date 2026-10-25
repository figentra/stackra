/**
 * Stackra file contract:
 * Purpose: `gcpBaseline(config, opts?)`, the Pulumi program of one environment's free GCP foundation: a GCP provider
 *          pinned to the environment's project and region with the cost labels as default labels, then the data key,
 *          the files bucket, the GitHub Workload Identity infra service account, and, from the project's first
 *          environment, the billing budget with its topic.
 * Boundary: creates resources only through Pulumi; agents run it under `stackra runway infra preview` or Pulumi's mocks
 *           and never apply it (`pulumi up` is the owner's or the deploy job's). The network, the database server,
 *           caches and queues are the runtime stack's, not this program's (ADR 0354 open question 1: the GCP runtime is
 *           not decided). Which region and project an environment uses is runway data; nothing here names one.
 * Runtime: node
 * Governing contract: ADR 0354 (decisions 1 to 5), ADR 0171 (decisions 1 to 5), ADR 0172 (decisions 1 and 5), ADR 0222.
 */
import * as pulumi from "@pulumi/pulumi";

import type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";
import { ciAccess } from "#node/functions/ci-access.function";
import { cloudProjectOf } from "#node/functions/cloud-project-of.function";
import { costControls } from "#node/functions/cost-controls.function";
import { dataKey } from "#node/functions/data-key.function";
import { filesBucket } from "#node/functions/files-bucket.function";
import { projectProvider } from "#node/functions/project-provider.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import { serviceAccountId } from "#node/functions/service-account-id.function";
import type { GcpBaselineOutputs } from "#node/types/gcp-baseline-outputs.type";

/**
 * The environment's foundation.
 *
 * @param config - from `gcpBaselineConfig(root, environment, origins)`, or the config file gen writes.
 * @throws TypeError when the project id, number, service account id or budget amount is malformed; Pulumi's config
 *         error when a `ref:` is unset.
 * @example
 * // .stackra/infra/index.ts (generated)
 * const config = gcpBaselineConfig(readRunway("runway.yaml", "root"), "production", origins);
 * export const foundation = gcpBaseline(config);
 */
export function gcpBaseline(
  config: GcpBaselineConfig,
  opts?: pulumi.ComponentResourceOptions,
): GcpBaselineOutputs {
  const { project, environment, region } = config;
  const cloud = cloudProjectOf(config.cloudProject, `the ${environment} project`);
  const prefix = `${project}-${environment}`;

  const group = new pulumi.ComponentResource("stackra:infra-gcp:Baseline", prefix, {}, opts);
  const provider = projectProvider(
    prefix,
    { project: cloud.id, region, labels: config.labels },
    { parent: group },
  );
  const options = { parent: group, provider };

  const key = dataKey(prefix, { project: cloud.id, region, ring: prefix }, options);

  const files =
    config.files === null
      ? null
      : filesBucket(
          `${prefix}-files`,
          {
            project: cloud.id,
            projectNumber: cloud.number,
            region,
            keyId: key.id,
            files: config.files,
          },
          options,
        );

  const infra =
    config.github === null
      ? null
      : ciAccess(
          prefix,
          {
            project: cloud.id,
            environment,
            github: config.github,
            accountId: serviceAccountId(project, environment),
          },
          options,
        );

  const topic =
    config.budgets === null || !config.ownsProject
      ? null
      : costControls(
          prefix,
          {
            project: cloud.id,
            projectNumber: cloud.number,
            billingAccount: resolveRef(config.budgets.billingAccount),
            currency: config.budgets.currency,
            amount: resolveRef(config.budgets.amount),
            thresholds: config.budgets.thresholds,
          },
          options,
        );

  return {
    dataKeyId: key.id,
    filesBucket: files?.name ?? null,
    infraServiceAccount: infra?.serviceAccount.email ?? null,
    workloadIdentityProvider: infra?.provider.name ?? null,
    budgetTopic: topic?.id ?? null,
  };
}
