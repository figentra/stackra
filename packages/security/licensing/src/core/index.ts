/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/licensing, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `decodeBase64`, `decryptLicence`, `isRecord` and `readLicence`
 *           stay internal. The shipped schema is
 *           re-exported under its generated name (`LicensingConfig$`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { LicensingConfig } from "#config/licensing.config";
export { LICENSING_CONFIG_SCHEMA as LicensingConfig$ } from "#core/constants/licensing-config-schema.constant";
export { KeygenLicenceVerifierDriver } from "#core/drivers/keygen-licence-verifier.driver";
export { LicenceStanding } from "#core/enums/licence-standing.enum";
export { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";
export { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
export { checkLicenceKey } from "#core/functions/check-licence-key.function";
export { licenceStanding } from "#core/functions/licence-standing.function";
export { verifyLicenceFile } from "#core/functions/verify-licence-file.function";
export { LicenceVerifier } from "#core/ports/licence-verifier.port";
export { LicensingOptions } from "#core/schemas/licensing-options.schema";
export type { Licence } from "#core/types/licence.type";
export type { LicenceFileOptions } from "#core/types/licence-file-options.type";
export type { LicenceKeyCheck } from "#core/types/licence-key-check.type";
export type { LicenceKeyCheckOptions } from "#core/types/licence-key-check-options.type";
