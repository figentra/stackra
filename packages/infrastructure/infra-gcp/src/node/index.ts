/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-gcp until `stackra gen` writes the entry barrels
 *          (STA-339): the Pulumi programs (`gcpBaseline` and `gcpRuntime` per deployment, `gcpOrganization` for the organization layer), the `ref:` resolver and the
 *          output types.
 * Boundary: names each re-export and declares nothing. Node only: it loads Pulumi. The building blocks (key, bucket,
 *           service account, budget) stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0354 (decision 3).
 */
export { gcpBaseline } from "#node/functions/gcp-baseline.function";
export { gcpOrganization } from "#node/functions/gcp-organization.function";
export { gcpRuntime } from "#node/functions/gcp-runtime.function";
export { resolveRef } from "#node/functions/resolve-ref.function";
export type { GcpBaselineOutputs } from "#node/types/gcp-baseline-outputs.type";
export type { GcpRuntimeOutputs } from "#node/types/gcp-runtime-outputs.type";
export type { GcpGrant } from "#node/types/gcp-grant.type";
export type { GcpOrgPolicy } from "#node/types/gcp-org-policy.type";
export type { GcpOrganizationArgs } from "#node/types/gcp-organization-args.type";
export type { GcpProject } from "#node/types/gcp-project.type";
