/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/licensing, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `decodeBase64`, `decryptLicence`, `isRecord` and `readLicence`
 *           stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { LicenceStanding } from "#core/enums/licence-standing.enum";
export { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";
export { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
export { checkLicenceKey } from "#core/functions/check-licence-key.function";
export { licenceStanding } from "#core/functions/licence-standing.function";
export { verifyLicenceFile } from "#core/functions/verify-licence-file.function";
export type { Licence } from "#core/types/licence.type";
export type { LicenceFileOptions } from "#core/types/licence-file-options.type";
export type { LicenceKeyCheck } from "#core/types/licence-key-check.type";
export type { LicenceKeyCheckOptions } from "#core/types/licence-key-check-options.type";
