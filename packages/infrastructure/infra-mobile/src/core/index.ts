/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/infra-mobile until `stackra gen` writes the entry barrels
 *          (STA-339): the mobile release plan read from the runways, its owner steps, its error and its types.
 * Boundary: names each re-export and declares nothing. Isomorphic: no Pulumi and no Node import, so `stackra infra
 *           gen` can build the plan anywhere; the stack config is `./node`'s. `configKeyOf` stays internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 (the infrastructure
 *                     category and its entries).
 */
export { MobileOwnerStep } from "#core/enums/mobile-owner-step.enum";
export { MobileInfraInvalidError } from "#core/errors/mobile-infra-invalid.error";
export { mobileInfraPlan } from "#core/functions/mobile-infra-plan.function";
export type { MobileIdentity } from "#core/types/mobile-identity.type";
export type { MobileInfraPlan } from "#core/types/mobile-infra-plan.type";
export type { MobileOwnerTask } from "#core/types/mobile-owner-task.type";
export type { MobileReleaseEnvironment } from "#core/types/mobile-release-environment.type";
