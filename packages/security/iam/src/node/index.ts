/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/iam (the record-visibility query filter: the
 *          `VisibilityFilter` driver and `registerVisibility`, which gen's entry calls) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reaches `@stackra/database/contracts` and
 *           `@stackra/model`, so it is kept out of the isomorphic `.` entry, which browser bundles import. It imports
 *           `.` and `./contracts` and re-exports neither (one symbol, one entry).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0333 (decision 4); the STA-347 stand-in barrel decision.
 */
export { IamVisibilityFilterDriver } from "#node/drivers/iam-visibility-filter.driver";
export { registerVisibility } from "#node/functions/register-visibility.function";
export type { VisibilityRegistration } from "#node/types/visibility-registration.type";
