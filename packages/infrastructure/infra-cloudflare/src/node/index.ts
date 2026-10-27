/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/infra-cloudflare until `stackra gen` writes the entry
 *          barrels (STA-339): the Pulumi programs of the Cloudflare core stack (the whole stack in one call, and each
 *          part for a stack that composes its own, the edge Worker's, the login directory Worker's and the registry Worker's among them) and the `ref:` resolver.
 * Boundary: names each re-export and declares nothing. Pulumi runs under Node only, so these never reach `.`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0171 (decisions 2 and 6); ADR 0437; ADR 0451; ADR 0453.
 */
export { accessGate } from "#node/functions/access-gate.function";
export { cloudflareCoreStack } from "#node/functions/cloudflare-core-stack.function";
export { cloudflareZone } from "#node/functions/cloudflare-zone.function";
export { devTunnel } from "#node/functions/dev-tunnel.function";
export { edgeWorker } from "#node/functions/edge-worker.function";
export { loginDirectoryWorker } from "#node/functions/login-directory-worker.function";
export { r2Bucket } from "#node/functions/r2-bucket.function";
export { registryWorker } from "#node/registry/registry-worker.function";
export { resolveRef } from "#node/functions/resolve-ref.function";
export { storefrontEdge } from "#node/functions/storefront-edge.function";
export { zoneEdge } from "#node/functions/zone-edge.function";
