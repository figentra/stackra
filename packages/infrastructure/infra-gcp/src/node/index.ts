/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-gcp until `stackra gen` writes the entry barrels
 *          (STA-339): the Pulumi program (`gcpBaseline` per environment), the `ref:` resolver and the output type.
 * Boundary: names each re-export and declares nothing. Node only: it loads Pulumi. The building blocks (key, bucket,
 *           service account, budget) stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0354 (decision 3).
 */
export { gcpBaseline } from "#node/functions/gcp-baseline.function";
export { resolveRef } from "#node/functions/resolve-ref.function";
export type { GcpBaselineOutputs } from "#node/types/gcp-baseline-outputs.type";
