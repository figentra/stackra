/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/runway until `stackra gen` writes the entry barrels (STA-339):
 *          the runway readers the generated configs import (`baseUrlOf`, `devPorts`, `updateFeed`, folded in from the
 *          old `./ports` entry, owner Q4; `productOf` and `brandsOf`, ADR 0335), the version 3 runway check, the JSON Schema derivation, the placement
 *          check, their enums, errors and types.
 * Boundary: names each re-export and declares nothing. The zod schemas, the facts reader and the dev facts path stay
 *           internal; Vite-facing helpers are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CacheEviction } from "#core/enums/cache-eviction.enum";
export { RequirementEngine } from "#core/enums/requirement-engine.enum";
export { RunwayEnvironment } from "#core/enums/runway-environment.enum";
export { RunwayKind } from "#core/enums/runway-kind.enum";
export { TopologyMode } from "#core/enums/topology-mode.enum";
export { RunwayInvalidError } from "#core/errors/runway-invalid.error";
export { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
export { baseUrlOf } from "#core/functions/base-url-of.function";
export { brandsOf } from "#core/functions/brands-of.function";
export { checkPlacement } from "#core/functions/check-placement.function";
export { devPorts } from "#core/functions/dev-ports.function";
export { parseRunway } from "#core/functions/parse-runway.function";
export { productOf } from "#core/functions/product-of.function";
export { runwayJsonSchema } from "#core/functions/runway-json-schema.function";
export { updateFeed } from "#core/functions/update-feed.function";
export type { AppRunway } from "#core/types/app-runway.type";
export type { Brand } from "#core/types/brand.type";
export type { DevPorts } from "#core/types/dev-ports.type";
export type { PlacementIssue } from "#core/types/placement-issue.type";
export type { Product } from "#core/types/product.type";
export type { RootRunway } from "#core/types/root-runway.type";
export type { RunwayDocument } from "#core/types/runway-document.type";
export type { RunwayFacts } from "#core/types/runway-facts.type";
export type { RunwayIssue } from "#core/types/runway-issue.type";
export type { ServiceRunway } from "#core/types/service-runway.type";
