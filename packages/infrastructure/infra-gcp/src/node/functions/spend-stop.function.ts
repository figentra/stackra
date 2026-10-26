/**
 * Stackra file contract:
 * Purpose: `spendStop(name, args, opts)`, the non-production spend stop of a GCP project: a service account allowed to
 *          unlink the project's billing (`roles/billing.projectManager`), a private bucket holding the function source,
 *          and a Cloud Function (2nd gen) triggered by the budget topic that detaches billing once the cost reaches
 *          `stopAt` percent of the budget.
 * Boundary: internal; `gcpBaseline` calls it for a project production does not run in, when the runway sets
 *           `providers.gcp.budgets.stopNonProdAt`. GCP budgets only alert, so this is the action. The function is
 *           reachable only from Eventarc (internal ingress, its own invoker binding); the source is fixed
 *           (`SPEND_STOP_SOURCE`) and reads only its two environment variables.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 5), ADR 0354 (decision 3), ADR 0401 (the billing-detach function).
 */
/* oxlint-disable no-new -- reason: Pulumi registers a resource when it is constructed; that is the point */
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

import { SPEND_STOP_SOURCE } from "#node/constants/spend-stop-source.constant";

/**
 * The spend stop.
 *
 * @param args.project - the project id whose billing is detached.
 * @param args.region - where the function and its source bucket live.
 * @param args.topic - the budget topic (`costControls`).
 * @param args.stopAt - the percentage of the budget that stops spend.
 * @param args.accountId - the function's service account id (`serviceAccountId(deployment, "stop")`).
 * @throws TypeError when `stopAt` is not a positive whole percentage.
 */
export function spendStop(
  name: string,
  args: {
    project: string;
    region: string;
    topic: gcp.pubsub.Topic;
    stopAt: number;
    accountId: string;
  },
  opts: pulumi.CustomResourceOptions,
): gcp.cloudfunctionsv2.Function {
  if (!Number.isInteger(args.stopAt) || args.stopAt < 1)
    throw new TypeError(`The spend stop of ${name} (${args.stopAt}%) is not a whole percentage`);
  const { project, region } = args;

  const account = new gcp.serviceaccount.Account(
    `${name}-stop`,
    { project, accountId: args.accountId, displayName: `${name} spend stop` },
    opts,
  );
  const member = pulumi.interpolate`serviceAccount:${account.email}`;
  new gcp.projects.IAMMember(
    `${name}-stop-billing`,
    { project, role: "roles/billing.projectManager", member },
    opts,
  );

  const bucket = new gcp.storage.Bucket(
    `${name}-functions`,
    {
      project,
      location: region,
      uniformBucketLevelAccess: true,
      publicAccessPrevention: "enforced",
    },
    opts,
  );
  const source = new gcp.storage.BucketObject(
    `${name}-stop`,
    {
      bucket: bucket.name,
      name: "spend-stop.zip",
      source: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(SPEND_STOP_SOURCE),
        "package.json": new pulumi.asset.StringAsset(
          JSON.stringify({ name: "spend-stop", private: true, main: "index.js" }),
        ),
      }),
    },
    opts,
  );

  const fn = new gcp.cloudfunctionsv2.Function(
    `${name}-stop`,
    {
      project,
      location: region,
      name: `${name}-stop`,
      description: `Detaches billing from ${project} at ${args.stopAt}% of its budget`,
      buildConfig: {
        runtime: "nodejs22",
        entryPoint: "stopSpend",
        source: { storageSource: { bucket: bucket.name, object: source.name } },
      },
      serviceConfig: {
        serviceAccountEmail: account.email,
        maxInstanceCount: 1,
        availableMemory: "256M",
        timeoutSeconds: 60,
        ingressSettings: "ALLOW_INTERNAL_ONLY",
        environmentVariables: { PROJECT_ID: project, STOP_AT_PERCENT: String(args.stopAt) },
      },
      eventTrigger: {
        triggerRegion: region,
        eventType: "google.cloud.pubsub.topic.v1.messagePublished",
        pubsubTopic: args.topic.id,
        retryPolicy: "RETRY_POLICY_RETRY",
        serviceAccountEmail: account.email,
      },
    },
    opts,
  );
  new gcp.cloudrunv2.ServiceIamMember(
    `${name}-stop-invoker`,
    { project, location: region, name: fn.name, role: "roles/run.invoker", member },
    opts,
  );
  return fn;
}
