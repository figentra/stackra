/**
 * Stackra file contract:
 * Purpose: `gcpBaseline(config, opts?)`, the Pulumi program of one deployment's free GCP foundation (an environment's,
 *          or a dedicated tenant's): a GCP provider pinned to its project and region with the cost labels as default
 *          labels, then the data key, the files bucket, the GitHub Workload Identity infra service account with the
 *          deploy roles, the Encore Cloud service account's roles where its services deploy to Encore Cloud, and, from the
 *          project's first deployment, the billing budget with its topic and, outside
 *          production, the spend stop that detaches billing; and the static egress addresses partners allow-list.
 * Boundary: creates resources only through Pulumi; agents run it under `stackra runway infra preview` or Pulumi's mocks
 *           and never apply it (`pulumi up` is the owner's or the deploy job's). The database server is `gcpRuntime`'s;
 *           the network, caches and queues are the runtime stack's (ADR 0354 open question 1). Which region and
 *           project a deployment uses is runway data; nothing here names one.
 * Runtime: node
 * Governing contract: ADR 0354 (decisions 1 to 5), ADR 0171 (decisions 1 to 5), ADR 0172 (decisions 1 and 5), ADR 0222,
 *                     ADR 0400, ADR 0401, ADR 0435, ADR 0402 (decision 2: static egress addresses).
 */
import * as pulumi from "@pulumi/pulumi";

import { serviceAccountId } from "#core/functions/service-account-id.function";
import type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";
import { ciAccess } from "#node/functions/ci-access.function";
import { cloudProjectOf } from "#node/functions/cloud-project-of.function";
import { costControls } from "#node/functions/cost-controls.function";
import { dataKey } from "#node/functions/data-key.function";
import { egressAddresses } from "#node/functions/egress-addresses.function";
import { encoreAccess } from "#node/functions/encore-access.function";
import { filesBucket } from "#node/functions/files-bucket.function";
import { projectProvider } from "#node/functions/project-provider.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import { spendStop } from "#node/functions/spend-stop.function";
import type { GcpBaselineOutputs } from "#node/types/gcp-baseline-outputs.type";

/** A resolved service account email. */
const SERVICE_ACCOUNT = /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/;

/**
 * The environment's foundation.
 *
 * @param config - from `gcpBaselineConfig(root, environment, origins)`, or the config file gen writes.
 * @throws TypeError when the project id, number, service account id, Encore service account or budget amount is
 *         malformed; Pulumi's config error when a `ref:` is unset.
 * @example
 * // .stackra/infra/index.ts (generated)
 * const config = gcpBaselineConfig(readRunway("runway.yaml", "root"), "production", origins);
 * export const foundation = gcpBaseline(config);
 */
export function gcpBaseline(
  config: GcpBaselineConfig,
  opts?: pulumi.ComponentResourceOptions,
): GcpBaselineOutputs {
  const { environment, region, deployment: prefix } = config;
  const cloud = cloudProjectOf(config.cloudProject, `the ${prefix} project`);

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
            pool: config.dedicated?.key ?? environment,
            github: config.github,
            accountId: serviceAccountId(prefix, "infra"),
          },
          options,
        );

  if (config.encore !== null) {
    const serviceAccount = resolveRef(config.encore.serviceAccount);
    if (!SERVICE_ACCOUNT.test(serviceAccount))
      throw new TypeError(
        `The Encore Cloud service account (${config.encore.serviceAccount}) is not a service account email`,
      );
    encoreAccess(prefix, { project: cloud.id, serviceAccount }, options);
  }

  const egress =
    config.egress === null
      ? null
      : egressAddresses(
          prefix,
          { project: cloud.id, region, count: config.egress.staticIps },
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

  const stop =
    topic === null || config.budgets?.stopAt == null
      ? null
      : spendStop(
          prefix,
          {
            project: cloud.id,
            region,
            topic,
            stopAt: config.budgets.stopAt,
            accountId: serviceAccountId(prefix, "stop"),
          },
          options,
        );

  return {
    dataKeyId: key.id,
    filesBucket: files?.name ?? null,
    infraServiceAccount: infra?.serviceAccount.email ?? null,
    workloadIdentityProvider: infra?.provider.name ?? null,
    budgetTopic: topic?.id ?? null,
    spendStopFunction: stop?.name ?? null,
    egressIps: egress?.publicIps ?? null,
    egressAddresses: egress?.selfLinks ?? null,
  };
}
