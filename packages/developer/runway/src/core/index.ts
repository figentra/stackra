/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/runway until `stackra gen` writes the entry barrels (STA-339):
 *          the runway readers the generated configs import (`baseUrlOf`, `devPorts`, `updateFeed`, folded in from the
 *          old `./ports` entry, owner Q4; `productOf` and `brandsOf`, ADR 0335), the version 3 runway check, the JSON Schema derivation, the placement
 *          check, the region check and reader (ADR 0354), the deploy targets, the `RunwayProvider` port and the
 *          `deploy`, `promote` and `rollback` orchestration (ADR 0352 decision 3, ADR 0400), the per-environment
 *          deploy lock (`withDeployLock`, ADR 0435), the surface, mobile and dev port checks (ADR 0441, STA-863), their
 *          enums, errors and types.
 * Boundary: names each re-export and declares nothing. The zod schemas, the facts reader and the dev facts path stay
 *           internal; Vite-facing helpers are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CacheEviction } from "#core/enums/cache-eviction.enum";
export { DeployKind } from "#core/enums/deploy-kind.enum";
export { RequirementEngine } from "#core/enums/requirement-engine.enum";
export { RunwayCloud } from "#core/enums/runway-cloud.enum";
export { RunwayEnvironment } from "#core/enums/runway-environment.enum";
export { RunwayKind } from "#core/enums/runway-kind.enum";
export { SurfaceKind } from "#core/enums/surface-kind.enum";
export { TopologyMode } from "#core/enums/topology-mode.enum";
export { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
export { RunwayInvalidError } from "#core/errors/runway-invalid.error";
export { RunwayLockedError } from "#core/errors/runway-locked.error";
export { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
export { baseUrlOf } from "#core/functions/base-url-of.function";
export { brandsOf } from "#core/functions/brands-of.function";
export { checkDevPorts } from "#core/functions/check-dev-ports.function";
export { checkPlacement } from "#core/functions/check-placement.function";
export { checkRegions } from "#core/functions/check-regions.function";
export { checkSurfaces } from "#core/functions/check-surfaces.function";
export { deployTargets } from "#core/functions/deploy-targets.function";
export { deploy } from "#core/functions/deploy.function";
export { devPorts } from "#core/functions/dev-ports.function";
export { parseRunway } from "#core/functions/parse-runway.function";
export { productOf } from "#core/functions/product-of.function";
export { promote } from "#core/functions/promote.function";
export { regionsOf } from "#core/functions/regions-of.function";
export { rollback } from "#core/functions/rollback.function";
export { runwayJsonSchema } from "#core/functions/runway-json-schema.function";
export { updateFeed } from "#core/functions/update-feed.function";
export { withDeployLock } from "#core/functions/with-deploy-lock.function";
export { RunwayProvider } from "#core/ports/runway-provider.port";
export type { AppRunway } from "#core/types/app-runway.type";
export type { Brand } from "#core/types/brand.type";
export type { DeployLock } from "#core/types/deploy-lock.type";
export type { DeployRecord } from "#core/types/deploy-record.type";
export type { DeployResult } from "#core/types/deploy-result.type";
export type { DeployStep } from "#core/types/deploy-step.type";
export type { DeployTarget } from "#core/types/deploy-target.type";
export type { DevPortIssue } from "#core/types/dev-port-issue.type";
export type { DevPorts } from "#core/types/dev-ports.type";
export type { EnvironmentCloud } from "#core/types/environment-cloud.type";
export type { MobileApp } from "#core/types/mobile-app.type";
export type { PlacementIssue } from "#core/types/placement-issue.type";
export type { Product } from "#core/types/product.type";
export type { RegionIssue } from "#core/types/region-issue.type";
export type { RootRunway } from "#core/types/root-runway.type";
export type { RunwayDocument } from "#core/types/runway-document.type";
export type { RunwayFacts } from "#core/types/runway-facts.type";
export type { RunwayIssue } from "#core/types/runway-issue.type";
export type { RunwayRegion } from "#core/types/runway-region.type";
export type { ServiceRunway } from "#core/types/service-runway.type";
export type { SurfaceIssue } from "#core/types/surface-issue.type";
export type { Surface } from "#core/types/surface.type";
