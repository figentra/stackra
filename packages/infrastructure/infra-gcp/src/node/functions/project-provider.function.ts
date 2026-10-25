/**
 * Stackra file contract:
 * Purpose: `projectProvider(name, args, opts)`, a GCP provider pinned to one project and region that stamps the cost
 *          labels on every resource taking labels, and bills its API quota to that project (the billing budget API
 *          needs a quota project).
 * Boundary: internal; credentials come from the environment the program runs in (the owner's gcloud session or the
 *           deploy job's Workload Identity token); the provider names its project, so a resource without an explicit
 *           project cannot land in another one.
 * Runtime: node
 * Governing contract: ADR 0354 (decisions 2 and 3), ADR 0172 (decision 5: cost tags).
 */
import * as gcp from "@pulumi/gcp";
import type * as pulumi from "@pulumi/pulumi";

/** The pinned provider. */
export function projectProvider(
  name: string,
  args: { project: string; region: string; labels: Readonly<Record<string, string>> },
  opts: pulumi.CustomResourceOptions,
): gcp.Provider {
  return new gcp.Provider(
    name,
    {
      project: args.project,
      region: args.region,
      defaultLabels: { ...args.labels },
      billingProject: args.project,
      userProjectOverride: true,
    },
    opts,
  );
}
