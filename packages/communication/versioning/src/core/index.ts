/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/versioning, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `ChangeBase` and `EventChangeBase` are exported as types only,
 *           so a declaration can name them while no class extends them bare. `isCalendarDate`, `eventChangeOf` and the
 *           registry stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Change } from "#core/bases/change.base";
export type { ChangeBase, EventChangeBase } from "#core/bases/change.base";
export { VERSION_SUPPORT_MONTHS } from "#core/constants/version-support-months.constant";
export { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";
export { UnsupportedVersionError } from "#core/errors/unsupported-version.error";
export { VersionSunsetError } from "#core/errors/version-sunset.error";
export { applyVersionHeaders } from "#core/functions/apply-version-headers.function";
export { downgrade } from "#core/functions/downgrade.function";
export { registerChanges } from "#core/functions/register-changes.function";
export { resolveVersion } from "#core/functions/resolve-version.function";
export { upgrade } from "#core/functions/upgrade.function";
export type { ChangeClass } from "#core/types/change-class.type";
export type { ChangeOptions } from "#core/types/change-options.type";
export type { ResolvedVersion } from "#core/types/resolved-version.type";
export type { VersionRequest } from "#core/types/version-request.type";
