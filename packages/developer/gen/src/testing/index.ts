/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/gen, the helpers contract and conformance tests import:
 *          `loadManifest`, `loadOpenApi`, `previousRelease`, `expectBackwardCompatible`, `projectOpenApi` and
 *          `discoverWithGen`, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test-time only; no runtime entry imports it.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0294 (decisions 10, 15 and 22); ADR 0144 as amended by 0263
 *                     (conformance); the STA-347 stand-in barrel decision.
 */
export { discoverWithGen } from "#testing/functions/discover-with-gen.function";
export { expectBackwardCompatible } from "#testing/functions/expect-backward-compatible.function";
export { loadManifest } from "#testing/functions/load-manifest.function";
export { loadOpenApi } from "#testing/functions/load-open-api.function";
export { previousRelease } from "#testing/functions/previous-release.function";
export { projectOpenApi } from "#testing/functions/project-open-api.function";
export type { DiscoveredTarget } from "#testing/types/discovered-target.type";
export type { LoadedManifest } from "#testing/types/loaded-manifest.type";
