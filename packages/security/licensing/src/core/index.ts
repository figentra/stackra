/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/licensing, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `decodeBase64`, `decryptLicence`, `isRecord` and `readLicence`
 *           stay internal. The shipped schema is
 *           re-exported under its generated name (`LicensingConfig$`, `IssuerConfig$`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { IssuerConfig } from "#config/issuer.config";
export { LicensingConfig } from "#config/licensing.config";
export { ISSUER_CONFIG_SCHEMA as IssuerConfig$ } from "#core/constants/issuer-config-schema.constant";
export { LICENSING_CONFIG_SCHEMA as LicensingConfig$ } from "#core/constants/licensing-config-schema.constant";
export { KeygenLicenceIssuerDriver } from "#core/drivers/keygen-licence-issuer.driver";
export { KeygenLicenceVerifierDriver } from "#core/drivers/keygen-licence-verifier.driver";
export { MemoryLicenceIssuerDriver } from "#core/drivers/memory-licence-issuer.driver";
export { RegistryLicenceIssuerDriver } from "#core/drivers/registry-licence-issuer.driver";
export { LicenceStanding } from "#core/enums/licence-standing.enum";
export { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";
export { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
export { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";
export { checkLicenceKey } from "#core/functions/check-licence-key.function";
export { generateInstallKey } from "#core/functions/generate-install-key.function";
export { installSigner } from "#core/functions/install-signer.function";
export { licenceStanding } from "#core/functions/licence-standing.function";
export { signUsageReport } from "#core/functions/sign-usage-report.function";
export { usageReportMessage } from "#core/functions/usage-report-message.function";
export { verifyLicenceFile } from "#core/functions/verify-licence-file.function";
export { LicenceIssuer } from "#core/ports/licence-issuer.port";
export { LicenceVerifier } from "#core/ports/licence-verifier.port";
export { IssuerOptions } from "#core/schemas/issuer-options.schema";
export { LicensingOptions } from "#core/schemas/licensing-options.schema";
export type { InstallKey } from "#core/types/install-key.type";
export type { Licence } from "#core/types/licence.type";
export type { LicenceDraft } from "#core/types/licence-draft.type";
export type { LicenceFileOptions } from "#core/types/licence-file-options.type";
export type { LicenceKeyCheck } from "#core/types/licence-key-check.type";
export type { LicenceKeyCheckOptions } from "#core/types/licence-key-check-options.type";
export type { SignedUsageReport } from "#core/types/signed-usage-report.type";
export type { UsageReportPayload } from "#core/types/usage-report-payload.type";
